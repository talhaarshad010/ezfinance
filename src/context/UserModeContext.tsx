import React, { createContext, Dispatch, ReactNode, SetStateAction, useContext, useMemo, useRef, useState } from 'react';
import { transactionsApi } from '../api/transactionsApi';
import { accountsApi } from '../api/accountsApi';
import {
  toBankAccount,
  toEnvelope,
  toUserBill,
  toUserGoal,
  toUserLoan,
  toUserTransfer,
  toUserTx,
} from '../services/transactionMapping';
import { uuidv4 } from '../utils/uuid';
import type { DebtEntry } from '../constants/ledgerData';
import { billsApi, loansApi, transfersApi } from '../api/ledgerApi';
import { budgetApi, goalsApi } from '../api/planningApi';
import type { BudgetCategory } from '../store/slices/budgetSlice';
import type { BankAccount } from '../store/slices/bankAccountsSlice';

/**
 * Two experiences of the main app:
 *
 * - New user (every signed-in account): no sample data. Empty states, a Getting started
 *   checklist, insights locked until there's enough data, and a guided tour on the account's
 *   first visit. Everything the user adds lives here.
 * - Returning user (Explore without logging in): the screens filled with sample data, as a demo
 *   of the app once it has real data. Never used for real accounts.
 */

export type TxType = 'expense' | 'income';
export type TxSource = 'manual' | 'scan' | 'scanFailed' | 'import';

export interface UserTx {
  /** UUID, created by the app and kept by the server. */
  id: string;
  type: TxType;
  category: string;
  amount: number;
  note?: string;
  /** The linked bank account it moved through. */
  accountId: string;
  date: Date;
  source?: TxSource;
  /** Left out of budget and spending totals. */
  excludeFromBudget?: boolean;
}
/** A bill paid every month from one of the user's linked accounts. */
export interface UserBill {
  id: string;
  accountId: string;
  name: string;
  amount: number;
  category: string;
  dueDay: number;
  remindDaysBefore: number;
  lastPaidOn: Date | null;
}

/** Money moved between two of the user's linked accounts. */
export interface UserTransfer {
  id: string;
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  note?: string;
  date: Date;
}

export interface UserGoal {
  /** UUID, created by the app and kept by the server. */
  id: string;
  name: string;
  target: number;
  saved: number;
  deadline?: Date;
  /** Feather icon chosen when the goal was created. */
  icon?: string;
  paused?: boolean;
}
export interface UserHolding {
  id: number;
  kind: string;
  amount: number;
}

export interface TxSheetPreset extends Partial<Omit<UserTx, 'id'>> {
  source?: TxSource;
  editId?: string;
}

/** Loading state of the user's transactions from the server. */
export type TxStatus = 'idle' | 'loading' | 'ready' | 'error';

/** Insights unlock once this many transactions are logged. */
export const UNLOCK_AT = 3;

interface UserModeCtx {
  isNewUser: boolean;
  /**
   * The real-account experience: no sample data, only what the user adds. Every signed-in account
   * uses it. `tour` shows the guided tour (first visit only).
   */
  beginNewUser: (options?: { tour?: boolean }) => void;
  /** The sample-data demo (Explore). Also used to reset state on log out. */
  beginReturningUser: () => void;

  txs: UserTx[];
  goals: UserGoal[];
  holdings: UserHolding[];
  budget: number | null;
  /** Repeated bills, loans and transfers (saved on the server; useLedgerActions changes them). */
  bills: UserBill[];
  setBills: Dispatch<SetStateAction<UserBill[]>>;
  debts: DebtEntry[];
  setDebts: Dispatch<SetStateAction<DebtEntry[]>>;
  transfers: UserTransfer[];
  setTransfers: Dispatch<SetStateAction<UserTransfer[]>>;
  /** Spending envelopes (category caps) on the Budget Planner. */
  envelopes: BudgetCategory[];
  setEnvelopes: Dispatch<SetStateAction<BudgetCategory[]>>;
  /** Bank accounts and wallets the user added; `balance` is the opening balance. */
  bankAccounts: BankAccount[];
  setBankAccounts: Dispatch<SetStateAction<BankAccount[]>>;

  /** Transactions on screen, newest first. Real accounts load them from the server. */
  txStatus: TxStatus;
  /** Loads the user's accounts and transactions (once; callers share the request). Rejects if it fails. */
  loadTxs: () => Promise<void>;
  /** Loads them again (pull to refresh). */
  reloadTxs: () => Promise<void>;
  // Local changes only; useTransactionActions also saves them to the server.
  addTx: (t: Omit<UserTx, 'id' | 'date'> & { date?: Date; id?: string }) => string;
  updateTx: (id: string, patch: Partial<Omit<UserTx, 'id'>>) => void;
  deleteTx: (id: string) => void;
  /** Undo for delete: puts the item back where it was. */
  restoreTx: (t: UserTx, index: number) => void;
  // Local changes only; usePlanningActions also saves goals and the budget on the server.
  addGoal: (g: UserGoal) => void;
  updateGoal: (id: string, patch: Partial<Omit<UserGoal, 'id'>>) => void;
  deleteGoal: (id: string) => void;
  restoreGoal: (g: UserGoal, index: number) => void;
  addHolding: (h: Omit<UserHolding, 'id'>) => number;
  setBudget: (n: number | null) => void;

  checklistHidden: boolean;
  setChecklistHidden: (v: boolean) => void;
  tourOpen: boolean;
  startTour: () => void;
  endTour: () => void;
  firstActionOpen: boolean;
  setFirstActionOpen: (v: boolean) => void;
  /** Global "add / edit transaction" sheet (opened from empty states, tour, getting started). */
  txSheet: { open: boolean; preset?: TxSheetPreset };
  openTxSheet: (preset?: TxSheetPreset) => void;
  closeTxSheet: () => void;
}

const Ctx = createContext<UserModeCtx | null>(null);

let nextId = Date.now();
const newId = () => ++nextId;

/** Newest first: by date, and the most recently added first within a day. */
const byDateDesc = (a: UserTx, b: UserTx) => b.date.getTime() - a.date.getTime();

export function UserModeProvider({ children }: { children: ReactNode }) {
  const [isNewUser, setIsNewUser] = useState(false);
  const [txs, setTxs] = useState<UserTx[]>([]);
  const [txStatus, setTxStatus] = useState<TxStatus>('idle');
  // Each account switch bumps the generation, so a load for the previous account is ignored.
  const generation = useRef(0);
  const txLoad = useRef<Promise<void> | null>(null);
  const [goals, setGoals] = useState<UserGoal[]>([]);
  const [holdings, setHoldings] = useState<UserHolding[]>([]);
  const [budget, setBudget] = useState<number | null>(null);
  const [bills, setBills] = useState<UserBill[]>([]);
  const [debts, setDebts] = useState<DebtEntry[]>([]);
  const [transfers, setTransfers] = useState<UserTransfer[]>([]);
  const [envelopes, setEnvelopes] = useState<BudgetCategory[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [checklistHidden, setChecklistHidden] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);
  const [firstActionOpen, setFirstActionOpen] = useState(false);
  const [txSheet, setTxSheet] = useState<UserModeCtx['txSheet']>({ open: false });

  const value = useMemo<UserModeCtx>(() => {
    const fetchTxs = (force: boolean) => {
      if (txLoad.current && !force) return txLoad.current;
      const gen = generation.current;
      setTxStatus(s => (s === 'ready' && force ? s : 'loading'));
      const run = Promise.all([
        accountsApi.list(),
        transactionsApi.listAll(),
        billsApi.list(),
        loansApi.list(),
        transfersApi.list(),
        goalsApi.list(),
        budgetApi.get(),
      ])
        .then(([accounts, list, billList, loanList, transferList, goalList, budgetData]) => {
          if (gen !== generation.current) return;
          setBankAccounts(accounts.map(toBankAccount));
          setTxs(list.map(toUserTx).sort(byDateDesc));
          setBills(billList.map(toUserBill));
          setDebts(loanList.map(toUserLoan));
          setTransfers(transferList.map(toUserTransfer));
          setGoals(goalList.map(toUserGoal));
          setBudget(budgetData.monthlyLimit === null ? null : Number(budgetData.monthlyLimit));
          setEnvelopes(budgetData.envelopes.map(toEnvelope));
          setTxStatus('ready');
        })
        .catch(error => {
          if (gen !== generation.current) return;
          txLoad.current = null; // a later call tries again
          setTxStatus(s => (s === 'ready' ? s : 'error'));
          throw error;
        });
      txLoad.current = run;
      return run;
    };
    const reset = () => {
      generation.current += 1;
      txLoad.current = null;
      setTxStatus('idle');
      setTxs([]);
      setGoals([]);
      setHoldings([]);
      setBudget(null);
      setBills([]);
      setDebts([]);
      setTransfers([]);
      setEnvelopes([]);
      setBankAccounts([]);
      setChecklistHidden(false);
      setFirstActionOpen(false);
      setTxSheet({ open: false });
    };
    return {
      isNewUser,
      beginNewUser: options => {
        reset();
        setIsNewUser(true);
        setTourOpen(options?.tour ?? true);
      },
      beginReturningUser: () => {
        reset();
        setIsNewUser(false);
        setTourOpen(false);
      },
      txs,
      txStatus,
      loadTxs: () => fetchTxs(false),
      reloadTxs: () => fetchTxs(true),
      goals,
      holdings,
      budget,
      bills,
      setBills,
      debts,
      setDebts,
      transfers,
      setTransfers,
      envelopes,
      setEnvelopes,
      bankAccounts,
      setBankAccounts,
      addTx: ({ id: givenId, ...t }) => {
        const id = givenId ?? uuidv4();
        setTxs(p => [{ date: new Date(), ...t, id }, ...p].sort(byDateDesc));
        return id;
      },
      updateTx: (id, patch) => setTxs(p => p.map(t => (t.id === id ? { ...t, ...patch } : t))),
      deleteTx: id => setTxs(p => p.filter(t => t.id !== id)),
      restoreTx: (t, i) =>
        setTxs(p => {
          const n = [...p];
          n.splice(Math.min(i, n.length), 0, t);
          return n;
        }),
      addGoal: g => setGoals(p => [...p.filter(x => x.id !== g.id), g]),
      restoreGoal: (g, i) =>
        setGoals(p => {
          const n = p.filter(x => x.id !== g.id);
          n.splice(Math.min(i, n.length), 0, g);
          return n;
        }),
      updateGoal: (id, patch) => setGoals(p => p.map(g => (g.id === id ? { ...g, ...patch } : g))),
      deleteGoal: id => setGoals(p => p.filter(g => g.id !== id)),
      addHolding: h => {
        const id = newId();
        setHoldings(p => [...p, { ...h, id }]);
        return id;
      },
      setBudget,
      checklistHidden,
      setChecklistHidden,
      tourOpen,
      startTour: () => setTourOpen(true),
      endTour: () => setTourOpen(false),
      firstActionOpen,
      setFirstActionOpen,
      txSheet,
      openTxSheet: preset => setTxSheet({ open: true, preset }),
      closeTxSheet: () => setTxSheet(s => ({ ...s, open: false })),
    };
  }, [isNewUser, txs, txStatus, goals, holdings, budget, bills, debts, transfers, envelopes, bankAccounts, checklistHidden, tourOpen, firstActionOpen, txSheet]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useUserMode() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useUserMode must be used inside UserModeProvider');
  return c;
}
