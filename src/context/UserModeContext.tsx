import React, { createContext, Dispatch, ReactNode, SetStateAction, useContext, useMemo, useState } from 'react';
import type { DebtEntry, UpcomingBill } from '../constants/ledgerData';
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
  id: number;
  type: TxType;
  category: string;
  amount: number;
  note?: string;
  account?: string;
  date: Date;
}
export interface UserGoal {
  id: number;
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
  editId?: number;
}

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
  /** Repeated bills and loans the user tracks on the Expenses screen. */
  bills: UpcomingBill[];
  setBills: Dispatch<SetStateAction<UpcomingBill[]>>;
  debts: DebtEntry[];
  setDebts: Dispatch<SetStateAction<DebtEntry[]>>;
  /** Spending envelopes (category caps) on the Budget Planner. */
  envelopes: BudgetCategory[];
  setEnvelopes: Dispatch<SetStateAction<BudgetCategory[]>>;
  /** Bank accounts and wallets the user added; `balance` is the opening balance. */
  bankAccounts: BankAccount[];
  setBankAccounts: Dispatch<SetStateAction<BankAccount[]>>;

  addTx: (t: Omit<UserTx, 'id' | 'date'> & { date?: Date }) => number;
  updateTx: (id: number, patch: Partial<Omit<UserTx, 'id'>>) => void;
  deleteTx: (id: number) => void;
  /** Undo for delete: puts the item back where it was. */
  restoreTx: (t: UserTx, index: number) => void;
  addGoal: (g: Omit<UserGoal, 'id' | 'saved'>) => number;
  updateGoal: (id: number, patch: Partial<Omit<UserGoal, 'id'>>) => void;
  deleteGoal: (id: number) => void;
  addHolding: (h: Omit<UserHolding, 'id'>) => number;
  setBudget: (n: number) => void;

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

export function UserModeProvider({ children }: { children: ReactNode }) {
  const [isNewUser, setIsNewUser] = useState(false);
  const [txs, setTxs] = useState<UserTx[]>([]);
  const [goals, setGoals] = useState<UserGoal[]>([]);
  const [holdings, setHoldings] = useState<UserHolding[]>([]);
  const [budget, setBudget] = useState<number | null>(null);
  const [bills, setBills] = useState<UpcomingBill[]>([]);
  const [debts, setDebts] = useState<DebtEntry[]>([]);
  const [envelopes, setEnvelopes] = useState<BudgetCategory[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [checklistHidden, setChecklistHidden] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);
  const [firstActionOpen, setFirstActionOpen] = useState(false);
  const [txSheet, setTxSheet] = useState<UserModeCtx['txSheet']>({ open: false });

  const value = useMemo<UserModeCtx>(() => {
    const reset = () => {
      setTxs([]);
      setGoals([]);
      setHoldings([]);
      setBudget(null);
      setBills([]);
      setDebts([]);
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
      goals,
      holdings,
      budget,
      bills,
      setBills,
      debts,
      setDebts,
      envelopes,
      setEnvelopes,
      bankAccounts,
      setBankAccounts,
      addTx: t => {
        const id = newId();
        setTxs(p => [{ date: new Date(), ...t, id }, ...p]);
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
      addGoal: g => {
        const id = newId();
        setGoals(p => [...p, { ...g, id, saved: 0 }]);
        return id;
      },
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
  }, [isNewUser, txs, goals, holdings, budget, bills, debts, envelopes, bankAccounts, checklistHidden, tourOpen, firstActionOpen, txSheet]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useUserMode() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useUserMode must be used inside UserModeProvider');
  return c;
}
