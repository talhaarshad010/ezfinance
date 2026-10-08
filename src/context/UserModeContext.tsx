import React, { createContext, ReactNode, useContext, useMemo, useState } from 'react';

/**
 * New vs returning user.
 *
 * - Returning user (log in / Google / explore): the existing screens with their sample data.
 * - New user (right after sign-up): a fresh, empty account — empty states, a Getting
 *   started checklist, locked insights until there's enough data, and a guided tour.
 *   Everything the new user adds lives here.
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
  /** Call from the sign-up success handler: empty account + guided tour. */
  beginNewUser: () => void;
  /** Call on log in / Google / explore / log out: back to the returning-user experience. */
  beginReturningUser: () => void;

  txs: UserTx[];
  goals: UserGoal[];
  holdings: UserHolding[];
  budget: number | null;

  addTx: (t: Omit<UserTx, 'id' | 'date'> & { date?: Date }) => number;
  updateTx: (id: number, patch: Partial<Omit<UserTx, 'id'>>) => void;
  deleteTx: (id: number) => void;
  /** Undo for delete: puts the item back where it was. */
  restoreTx: (t: UserTx, index: number) => void;
  addGoal: (g: Omit<UserGoal, 'id' | 'saved'>) => number;
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
      setChecklistHidden(false);
      setFirstActionOpen(false);
      setTxSheet({ open: false });
    };
    return {
      isNewUser,
      beginNewUser: () => {
        reset();
        setIsNewUser(true);
        setTourOpen(true);
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
  }, [isNewUser, txs, goals, holdings, budget, checklistHidden, tourOpen, firstActionOpen, txSheet]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useUserMode() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useUserMode must be used inside UserModeProvider');
  return c;
}
