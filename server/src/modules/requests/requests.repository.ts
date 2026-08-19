import mongoose from "mongoose";
import type { BrokerRequest, RequestImage } from "@shared/types";
import {
  BrokerRequestModel,
  RequestImageModel,
  type MongoBrokerRequest,
  type MongoRequestImage,
} from "../../database/schemas/request.schema";
import type { MongoUser } from "../../database/schemas/user.schema";

type PopulatedBrokerRequest = Omit<MongoBrokerRequest, "userId"> & {
  userId: MongoUser;
};

function toRequestImage(doc: MongoRequestImage): RequestImage {
  return {
    id: doc._id.toString(),
    requestId: doc.requestId.toString(),
    imageUrl: doc.imageUrl,
    publicId: doc.publicId,
    createdAt: doc.createdAt,
  };
}

function toBrokerRequest(
  doc: PopulatedBrokerRequest | MongoBrokerRequest,
  images: MongoRequestImage[] = []
): BrokerRequest {
  const user = typeof doc.userId === "object" && "_id" in doc.userId ? (doc.userId as MongoUser) : null;
  const userIdStr = user ? user._id.toString() : (doc.userId as mongoose.Types.ObjectId).toString();

  return {
    id: doc._id.toString(),
    brokerAccountId: doc.brokerAccountId.toString(),
    userId: userIdStr,
    brokerName: user?.name ?? null,
    brokerPhone: user?.phone ?? null,
    productName: doc.productName,
    description: doc.description || "",
    status: doc.status,
    images: images.map(toRequestImage),
    isDeleted: Boolean(doc.isDeleted),
    deletedAt: doc.deletedAt ?? null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export class RequestsRepository {
  async listAll(): Promise<BrokerRequest[]> {
    const requests = (await BrokerRequestModel.find({ isDeleted: { $ne: true } })
      .populate("userId")
      .sort({ createdAt: -1 })
      .lean()) as unknown as PopulatedBrokerRequest[];

    if (!requests.length) return [];

    const requestIds = requests.map(r => r._id);
    const images = (await RequestImageModel.find({ requestId: { $in: requestIds } })
      .sort({ createdAt: 1 })
      .lean()) as unknown as MongoRequestImage[];

    const imageMap = new Map<string, MongoRequestImage[]>();
    for (const img of images) {
      const rId = img.requestId.toString();
      if (!imageMap.has(rId)) imageMap.set(rId, []);
      imageMap.get(rId)!.push(img);
    }

    return requests.map(r => toBrokerRequest(r, imageMap.get(r._id.toString()) || []));
  }

  async listByBroker(brokerAccountId: string): Promise<BrokerRequest[]> {
    if (!mongoose.Types.ObjectId.isValid(brokerAccountId)) return [];

    const requests = (await BrokerRequestModel.find({
      brokerAccountId: new mongoose.Types.ObjectId(brokerAccountId),
      isDeleted: { $ne: true },
    })
      .populate("userId")
      .sort({ createdAt: -1 })
      .lean()) as unknown as PopulatedBrokerRequest[];

    if (!requests.length) return [];

    const requestIds = requests.map(r => r._id);
    const images = (await RequestImageModel.find({ requestId: { $in: requestIds } })
      .sort({ createdAt: 1 })
      .lean()) as unknown as MongoRequestImage[];

    const imageMap = new Map<string, MongoRequestImage[]>();
    for (const img of images) {
      const rId = img.requestId.toString();
      if (!imageMap.has(rId)) imageMap.set(rId, []);
      imageMap.get(rId)!.push(img);
    }

    return requests.map(r => toBrokerRequest(r, imageMap.get(r._id.toString()) || []));
  }

  async findById(id: string): Promise<BrokerRequest | undefined> {
    if (!mongoose.Types.ObjectId.isValid(id)) return undefined;

    const request = (await BrokerRequestModel.findOne({
      _id: new mongoose.Types.ObjectId(id),
      isDeleted: { $ne: true },
    })
      .populate("userId")
      .lean()) as unknown as PopulatedBrokerRequest | null;

    if (!request) return undefined;

    const images = (await RequestImageModel.find({ requestId: request._id })
      .sort({ createdAt: 1 })
      .lean()) as unknown as MongoRequestImage[];

    return toBrokerRequest(request, images);
  }

  async create(input: {
    brokerAccountId: string;
    userId: string;
    productName: string;
    description?: string;
    images?: Array<{ imageUrl: string; publicId: string }>;
  }): Promise<BrokerRequest> {
    return mongoose.connection.transaction(async session => {
      const [requestDoc] = await BrokerRequestModel.create(
        [
          {
            brokerAccountId: new mongoose.Types.ObjectId(input.brokerAccountId),
            userId: new mongoose.Types.ObjectId(input.userId),
            productName: input.productName.trim(),
            description: input.description?.trim() || "",
            status: "pending",
            isDeleted: false,
          },
        ],
        { session, ordered: true }
      );

      let savedImages: MongoRequestImage[] = [];
      if (input.images && input.images.length > 0) {
        savedImages = (await RequestImageModel.insertMany(
          input.images.map(img => ({
            requestId: requestDoc._id,
            imageUrl: img.imageUrl,
            publicId: img.publicId,
          })),
          { session }
        )) as unknown as MongoRequestImage[];
      }

      return toBrokerRequest(requestDoc as unknown as MongoBrokerRequest, savedImages);
    });
  }

  async softDelete(id: string): Promise<boolean> {
    if (!mongoose.Types.ObjectId.isValid(id)) return false;
    const res = await BrokerRequestModel.findByIdAndUpdate(
      id,
      { $set: { isDeleted: true, deletedAt: new Date() } }
    );
    return Boolean(res);
  }
}

export const requestsRepository = new RequestsRepository();
