import { Router } from "express";
import authRoutes from "./modules/auth/auth.routes";
import brokerRoutes from "./modules/brokers/brokers.routes";
import ledgerRoutes from "./modules/ledger/ledger.routes";
import productsRoutes from "./modules/products/products.routes";
import requestsRoutes from "./modules/requests/requests.routes";
import usersRoutes from "./modules/users/users.routes";

export const routes = Router();
routes.use("/auth", authRoutes);
routes.use("/brokers", brokerRoutes);
routes.use("/entries", ledgerRoutes);
routes.use("/products", productsRoutes);
routes.use("/requests", requestsRoutes);
routes.use("/users", usersRoutes);
