import type { User } from "@shared/types";
import { ForbiddenError, NotFoundError } from "@shared/errors";

export function assertCanViewBrokerAccount(user: User, account: { userId: number } | null | undefined) {
  if (!account) throw NotFoundError("Broker account not found");
  if (user.role !== "admin" && account.userId !== user.id) throw ForbiddenError("You can only view your own account");
}
