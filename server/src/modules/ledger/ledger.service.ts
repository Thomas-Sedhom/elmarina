import { assertCanViewBrokerAccount } from "../../shared/security/access";
import type { User } from "@shared/types";
import { ledgerRepository, type LedgerEntryInput } from "./ledger.repository";

export class LedgerService {
  async listForBroker(accountId: string, user: User) {
    const account = await ledgerRepository.findBrokerAccount(accountId);
    assertCanViewBrokerAccount(user, account ? { userId: account.userId.toString() } : null);
    return ledgerRepository.listByBrokerAccount(accountId);
  }
  create(input: LedgerEntryInput & { createdBy: string; updatedBy: string }) { return ledgerRepository.create(input); }
  update(id: string, input: LedgerEntryInput & { createdBy: string; updatedBy: string }) { return ledgerRepository.update(id, input); }
  delete(id: string) { return ledgerRepository.delete(id); }
}

export const ledgerService = new LedgerService();
