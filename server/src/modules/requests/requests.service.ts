import { ForbiddenError, NotFoundError } from "@shared/errors";
import type { User } from "@shared/types";
import { requestsRepository } from "./requests.repository";
import { brokersRepository } from "../brokers/brokers.repository";
import { cloudinaryService } from "../../shared/services/cloudinary.service";

export class RequestsService {
  async listForUser(user: User) {
    if (user.role === "admin") {
      return requestsRepository.listAll();
    }
    // Broker: list their own requests
    const account = await brokersRepository.findByUserId(user.id);
    if (!account) return [];
    return requestsRepository.listByBroker(account.id);
  }

  async getById(id: string, user: User) {
    const request = await requestsRepository.findById(id);
    if (!request) throw NotFoundError("Request not found");

    if (user.role !== "admin" && request.userId !== user.id) {
      throw ForbiddenError("You can only view your own requests");
    }

    return request;
  }

  async uploadImage(base64OrUrl: string) {
    if (!cloudinaryService.isConfigured()) {
      return {
        imageUrl: base64OrUrl,
        publicId: `req_local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      };
    }

    const uploadRes = await cloudinaryService.uploadImage(base64OrUrl, {
      folder: "elmarina/requests",
    });

    return {
      imageUrl: uploadRes.secureUrl,
      publicId: uploadRes.publicId,
    };
  }

  async create(
    input: {
      productName: string;
      description?: string;
      images?: Array<{ imageUrl: string; publicId: string }>;
    },
    user: User
  ) {
    const account = await brokersRepository.findByUserId(user.id);
    if (!account) throw NotFoundError("Broker account not found");

    return requestsRepository.create({
      brokerAccountId: account.id,
      userId: user.id,
      productName: input.productName,
      description: input.description,
      images: input.images,
    });
  }

  async delete(id: string) {
    const success = await requestsRepository.softDelete(id);
    if (!success) throw NotFoundError("Request not found");
    return { success: true };
  }
}

export const requestsService = new RequestsService();
