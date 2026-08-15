import * as db from "../../database";

export type LedgerEntryInput = {
  brokerAccountId: number;
  businessDate: Date;
  weight: string;
  description: string;
  cash: string;
  notes: string | null;
  type: "work" | "breakage";
};

export class LedgerRepository {
  findBrokerAccount(id: number) { return db.getBrokerAccount(id); }
  listByBrokerAccount(id: number) { return db.listSheetEntries(id); }
  create(input: LedgerEntryInput & { createdBy: number; updatedBy: number }) { return db.createSheetEntry(input); }
  update(id: number, input: LedgerEntryInput & { createdBy: number; updatedBy: number }) { return db.updateSheetEntry(id, input); }
  delete(id: number) { return db.deleteSheetEntry(id); }
}

export const ledgerRepository = new LedgerRepository();
