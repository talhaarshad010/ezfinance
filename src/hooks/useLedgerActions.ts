import { billsApi, loansApi, transfersApi } from '../api/ledgerApi';
import { UserBill, UserTransfer, useUserMode } from '../context/UserModeContext';
import type { DebtEntry } from '../constants/ledgerData';
import { toApiDate, toLoanFields, toUserBill, toUserLoan, toUserTransfer, toUserTx } from '../services/transactionMapping';
import { uuidv4 } from '../utils/uuid';

export type BillInput = Omit<UserBill, 'id' | 'lastPaidOn'>;
export type TransferInput = Omit<UserTransfer, 'id'>;

const billFields = (b: BillInput) => ({
  accountId: b.accountId,
  name: b.name.trim(),
  amount: Math.round(b.amount * 100) / 100,
  category: b.category,
  dueDay: b.dueDay,
  remindDaysBefore: b.remindDaysBefore,
});

/**
 * Changes to a signed-in user's repeated bills, loans and transfers. Each one is saved on the
 * server (these need a connection). The screen updates right away; if the server turns the change
 * down or can't be reached, it's undone and the error is thrown for the caller to show.
 */
export function useLedgerActions() {
  const userMode = useUserMode();

  async function attempt(apply: () => void, rollback: () => void, call: () => Promise<unknown>) {
    apply();
    try {
      await call();
    } catch (error) {
      rollback();
      throw error;
    }
  }

  return {
    // ── Repeated bills ──
    async addBill(input: BillInput) {
      const id = uuidv4();
      const created = await billsApi.create(id, billFields(input));
      userMode.setBills(p => [...p.filter(b => b.id !== id), toUserBill(created)]);
    },
    async updateBill(id: string, input: BillInput) {
      const before = userMode.bills.find(b => b.id === id);
      if (!before) return;
      await attempt(
        () => userMode.setBills(p => p.map(b => (b.id === id ? { ...b, ...input } : b))),
        () => userMode.setBills(p => p.map(b => (b.id === id ? before : b))),
        () => billsApi.update(id, billFields(input)),
      );
    },
    async deleteBill(id: string) {
      const index = userMode.bills.findIndex(b => b.id === id);
      const removed = userMode.bills[index];
      if (!removed) return;
      await attempt(
        () => userMode.setBills(p => p.filter(b => b.id !== id)),
        () => userMode.setBills(p => [...p.slice(0, index), removed, ...p.slice(index)]),
        () => billsApi.remove(id),
      );
    },
    /** Logs the bill as an expense in its account (shows up in Transactions) and marks it paid. */
    async payBill(id: string, date = new Date()) {
      const { bill, transaction } = await billsApi.pay(id, uuidv4(), toApiDate(date));
      userMode.setBills(p => p.map(b => (b.id === id ? toUserBill(bill) : b)));
      const tx = toUserTx(transaction);
      userMode.addTx({ ...tx, id: tx.id });
    },

    // ── Loans ──
    async saveLoan(entry: DebtEntry) {
      const existing = userMode.debts.find(d => d.id === entry.id);
      if (!existing) {
        const id = uuidv4();
        const created = await loansApi.create(id, toLoanFields(entry));
        userMode.setDebts(p => [...p, toUserLoan(created)]);
        return;
      }
      await attempt(
        () => userMode.setDebts(p => p.map(d => (d.id === entry.id ? entry : d))),
        () => userMode.setDebts(p => p.map(d => (d.id === entry.id ? existing : d))),
        () => loansApi.update(String(entry.id), toLoanFields(entry)),
      );
    },
    async deleteLoan(id: string) {
      const index = userMode.debts.findIndex(d => d.id === id);
      const removed = userMode.debts[index];
      if (!removed) return;
      await attempt(
        () => userMode.setDebts(p => p.filter(d => d.id !== id)),
        () => userMode.setDebts(p => [...p.slice(0, index), removed, ...p.slice(index)]),
        () => loansApi.remove(id),
      );
    },

    // ── Transfers ──
    async addTransfer(input: TransferInput) {
      const id = uuidv4();
      const created = await transfersApi.create({
        id,
        fromAccountId: input.fromAccountId,
        toAccountId: input.toAccountId,
        amount: Math.round(input.amount * 100) / 100,
        note: input.note?.trim() || null,
        date: toApiDate(input.date),
      });
      userMode.setTransfers(p => [toUserTransfer(created), ...p.filter(t => t.id !== id)]);
    },
    /** Deletes a transfer; keep the returned one to undo with `restoreTransfer`. */
    async deleteTransfer(id: string) {
      const removed = userMode.transfers.find(t => t.id === id);
      if (!removed) throw new Error('Transfer not found');
      await attempt(
        () => userMode.setTransfers(p => p.filter(t => t.id !== id)),
        () => userMode.setTransfers(p => [removed, ...p]),
        () => transfersApi.remove(id),
      );
      return removed;
    },
    async restoreTransfer(transfer: UserTransfer) {
      await attempt(
        () => userMode.setTransfers(p => [transfer, ...p.filter(t => t.id !== transfer.id)]),
        () => userMode.setTransfers(p => p.filter(t => t.id !== transfer.id)),
        () => transfersApi.restore(transfer.id),
      );
    },
  };
}
