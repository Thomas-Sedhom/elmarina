import { ForbiddenError, NotFoundError } from "@shared/errors";
import type { User } from "@shared/types";
import { brokersRepository } from "./brokers.repository";

export class BrokersService {
  list(search?: string) { return brokersRepository.list(search); }
  create(input: { name: string; phone: string; password: string }) { return brokersRepository.create(input); }
  async getById(id: string, user: User) {
    const account = await brokersRepository.findById(id);
    if (!account) throw NotFoundError("Broker account not found");
    if (user.role !== "admin" && account.userId !== user.id) throw ForbiddenError("You can only view your own account");
    return account;
  }
  async getMyAccount(user: User) {
    const account = await brokersRepository.findByUserId(user.id);
    if (!account) throw NotFoundError("Broker account not found");
    return account;
  }
  async toggleBlock(id: string, isBlocked: boolean) {
    const account = await brokersRepository.updateBlockStatus(id, isBlocked);
    if (!account) throw NotFoundError("Broker account not found");
    return account;
  }
}

export const brokersService = new BrokersService();
