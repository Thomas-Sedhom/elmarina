import * as db from "../../../db";

export class BrokersRepository {
  list(search?: string) { return db.listBrokers(search); }
  findById(id: number) { return db.getBrokerAccount(id); }
  create(input: { name: string; phone: string; password: string }) { return db.createBroker(input); }
}

export const brokersRepository = new BrokersRepository();
