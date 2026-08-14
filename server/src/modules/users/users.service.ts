import type { User } from "@shared/types";
import { usersRepository } from "./users.repository";

export class UsersService {
  me(user: User) {
    return usersRepository.toSafeUser(user);
  }
}

export const usersService = new UsersService();
