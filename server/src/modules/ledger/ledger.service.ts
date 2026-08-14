import { assertCanViewBrokerAccount } from "../../shared/security/access";
import type { User } from "@shared/types";
import { ledgerRepository, type LedgerEntryInput } from "./ledger.repository";

export class LedgerService {
  async listForBroker(accountId: number, user: User) {
    const account = await ledgerRepository.findBrokerAccount(accountId);
    assertCanViewBrokerAccount(user, account);
    return ledgerRepository.listByBrokerAccount(accountId);
  }
  create(input: LedgerEntryInput & { createdBy: number; updatedBy: number }) { return ledgerRepository.create(input); }
  update(id: number, input: LedgerEntryInput & { createdBy: number; updatedBy: number }) { return ledgerRepository.update(id, input); }
  delete(id: number) { return ledgerRepository.delete(id); }
}

export const ledgerService = new LedgerService();
