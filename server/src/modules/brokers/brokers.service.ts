import { ForbiddenError, NotFoundError } from "@shared/_core/errors";
import type { User } from "@shared/types";
import { brokersRepository } from "./brokers.repository";

export class BrokersService {
  list(search?: string) { return brokersRepository.list(search); }
  create(input: { name: string; phone: string; password: string }) { return brokersRepository.create(input); }
  async getById(id: number, user: User) {
    const account = await brokersRepository.findById(id);
    if (!account) throw NotFoundError("Broker account not found");
    if (user.role !== "admin" && account.userId !== user.id) throw ForbiddenError("You can only view your own account");
    return account;
  }
}

export const brokersService = new BrokersService();
