import { ApiError } from '../api/client';
import { transactionsApi } from '../api/transactionsApi';
import { useNetwork, SyncOp } from '../context/NetworkContext';
import { UserTx, useUserMode } from '../context/UserModeContext';
import { toApiSource, toFields } from '../services/transactionMapping';
import { fullAmt } from '../utils/format';
import { uuidv4 } from '../utils/uuid';

/** "saved": the server has it. "queued": kept on the phone and sent once the server is reachable. */
export type SaveResult = 'saved' | 'queued';

export type TxInput = Omit<UserTx, 'id'>;

/** A transaction's fields without its id. */
function fieldsOf(tx: UserTx): TxInput {
  const fields: Partial<UserTx> = { ...tx };
  delete fields.id;
  return fields as TxInput;
}

const labelOf = (t: Pick<UserTx, 'note' | 'category' | 'amount'>) =>
  `${t.note ?? t.category} · PKR ${fullAmt(t.amount)}`;

/**
 * Every change to a signed-in user's transactions: the screen updates at once, then the change
 * goes to the server. Offline (or when the server can't be reached) it's queued and sent later.
 * If the server turns it down, the screen change is undone and the error is thrown for the
 * caller to show.
 */
export function useTransactionActions() {
  const userMode = useUserMode();
  const network = useNetwork();

  async function send(
    op: Omit<SyncOp, 'id' | 'at' | 'status'>,
    call: () => Promise<unknown>,
    rollback: () => void,
  ): Promise<SaveResult> {
    if (!network.online) {
      network.record(op, { force: true });
      return 'queued';
    }
    try {
      await call();
      return 'saved';
    } catch (error) {
      if (error instanceof ApiError && error.code === 'network') {
        network.record(op, { force: true });
        return 'queued';
      }
      rollback();
      throw error;
    }
  }

  const find = (id: string) => {
    const index = userMode.txs.findIndex(t => t.id === id);
    return { tx: index >= 0 ? userMode.txs[index] : undefined, index };
  };

  return {
    /** Adds a transaction; resolves with its id and whether the server has it yet. */
    async create(input: TxInput): Promise<{ id: string; result: SaveResult }> {
      const id = uuidv4();
      userMode.addTx({ ...input, id });
      const payload = { id, ...toFields(input), source: toApiSource(input.source) };
      const result = await send(
        { entity: 'tx', entityId: id, action: 'create', label: labelOf(input), payload },
        () => transactionsApi.create(payload),
        () => userMode.deleteTx(id),
      );
      return { id, result };
    },

    /** Saves the full new state of a transaction (edit, change category, exclude from budget). */
    async update(id: string, patch: Partial<TxInput>): Promise<SaveResult> {
      const { tx: before } = find(id);
      if (!before) throw new Error('Transaction not found');
      const prev = fieldsOf(before);
      const next: TxInput = { ...prev, ...patch };
      userMode.updateTx(id, next);
      const payload = toFields(next);
      return send(
        { entity: 'tx', entityId: id, action: 'update', label: labelOf(next), payload },
        () => transactionsApi.update(id, payload),
        () => userMode.updateTx(id, prev),
      );
    },

    /** Deletes a transaction. Keep the returned snapshot to undo with `restore`. */
    async remove(id: string): Promise<{ tx: UserTx; index: number; result: SaveResult }> {
      const { tx, index } = find(id);
      if (!tx) throw new Error('Transaction not found');
      userMode.deleteTx(id);
      const result = await send(
        { entity: 'tx', entityId: id, action: 'delete', label: `Delete · ${tx.note ?? tx.category}` },
        () => transactionsApi.remove(id),
        () => userMode.restoreTx(tx, index),
      );
      return { tx, index, result };
    },

    /** Undo for `remove`: puts the transaction back where it was. */
    restore(tx: UserTx, index: number): Promise<SaveResult> {
      userMode.restoreTx(tx, index);
      return send(
        { entity: 'tx', entityId: tx.id, action: 'restore', label: `Restore · ${tx.note ?? tx.category}` },
        () => transactionsApi.restore(tx.id),
        () => userMode.deleteTx(tx.id),
      );
    },

    /** Replaces a transaction with parts that add up to it (same type, account and date). */
    async split(
      id: string,
      parts: { amount: number; category: string; note?: string }[],
    ): Promise<SaveResult> {
      const { tx, index } = find(id);
      if (!tx) throw new Error('Transaction not found');
      const base = fieldsOf(tx);
      const withIds = parts.map(p => ({ ...p, id: uuidv4() }));
      userMode.deleteTx(id);
      withIds.forEach(p => userMode.addTx({ ...base, amount: p.amount, category: p.category, note: p.note ?? base.note, id: p.id }));
      const payload = {
        parts: withIds.map(p => ({ id: p.id, amount: p.amount, category: p.category, note: p.note ?? null })),
      };
      return send(
        { entity: 'tx', entityId: id, action: 'split', label: `Split · ${tx.note ?? tx.category}`, payload },
        () => transactionsApi.split(id, payload.parts),
        () => {
          withIds.forEach(p => userMode.deleteTx(p.id));
          userMode.restoreTx(tx, index);
        },
      );
    },
  };
}
