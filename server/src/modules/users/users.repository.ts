import * as db from "../../../db";

export class UsersRepository {
  findByOpenId(openId: string) { return db.getUserByOpenId(openId); }
  toSafeUser(user: NonNullable<Awaited<ReturnType<typeof db.getUserByOpenId>>>) { return db.toSafeUser(user); }
}

export const usersRepository = new UsersRepository();
