import { v2 as cloudinary, type UploadApiOptions, type UploadApiResponse, type TransformationOptions } from "cloudinary";
import { ENV } from "../config/env";

export interface CloudinaryUploadResult {
  publicId: string;
  url: string;
  secureUrl: string;
  width?: number;
  height?: number;
  format?: string;
  bytes?: number;
  resourceType?: string;
}

export class CloudinaryService {
  private initialized = false;

  constructor() {
    this.init();
  }

  private init() {
    if (this.initialized) return;

    if (ENV.cloudinary.url) {
      cloudinary.config({
        cloudinary_url: ENV.cloudinary.url,
      });
      this.initialized = true;
    } else if (ENV.cloudinary.cloudName && ENV.cloudinary.apiKey && ENV.cloudinary.apiSecret) {
      cloudinary.config({
        cloud_name: ENV.cloudinary.cloudName,
        api_key: ENV.cloudinary.apiKey,
        api_secret: ENV.cloudinary.apiSecret,
        secure: true,
      });
      this.initialized = true;
    }
  }

  /**
   * Checks if Cloudinary credentials are configured in the environment.
   */
  public isConfigured(): boolean {
    this.init();
    return Boolean(
      ENV.cloudinary.url ||
      (ENV.cloudinary.cloudName && ENV.cloudinary.apiKey && ENV.cloudinary.apiSecret)
    );
  }

  /**
   * Uploads an image (file path, remote URL, base64 data URI, or string) to Cloudinary.
   */
  public async uploadImage(
    source: string,
    options: UploadApiOptions = {}
  ): Promise<CloudinaryUploadResult> {
    this.init();
    if (!this.isConfigured()) {
      throw new Error(
        "Cloudinary is not configured. Please set CLOUDINARY_URL or CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in your .env file."
      );
    }

    const defaultOptions: UploadApiOptions = {
      folder: "elmarina",
      resource_type: "auto",
      ...options,
    };

    const response: UploadApiResponse = await cloudinary.uploader.upload(source, defaultOptions);

    return {
      publicId: response.public_id,
      url: response.url,
      secureUrl: response.secure_url,
      width: response.width,
      height: response.height,
      format: response.format,
      bytes: response.bytes,
      resourceType: response.resource_type,
    };
  }

  /**
   * Uploads a raw memory Buffer to Cloudinary using upload_stream.
   */
  public async uploadBuffer(
    buffer: Buffer,
    options: UploadApiOptions = {}
  ): Promise<CloudinaryUploadResult> {
    this.init();
    if (!this.isConfigured()) {
      throw new Error(
        "Cloudinary is not configured. Please set CLOUDINARY_URL or CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in your .env file."
      );
    }

    const defaultOptions: UploadApiOptions = {
      folder: "elmarina",
      resource_type: "auto",
      ...options,
    };

    return new Promise<CloudinaryUploadResult>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(defaultOptions, (error, response) => {
        if (error || !response) {
          return reject(error || new Error("Cloudinary upload failed with empty response"));
        }
        resolve({
          publicId: response.public_id,
          url: response.url,
          secureUrl: response.secure_url,
          width: response.width,
          height: response.height,
          format: response.format,
          bytes: response.bytes,
          resourceType: response.resource_type,
        });
      });

      stream.end(buffer);
    });
  }

  /**
   * Deletes an image from Cloudinary by its public ID.
   */
  public async deleteImage(publicId: string): Promise<{ result: string }> {
    this.init();
    if (!this.isConfigured()) {
      throw new Error("Cloudinary is not configured.");
    }
    return cloudinary.uploader.destroy(publicId);
  }

  /**
   * Generates an optimized, auto-formatted Cloudinary image URL.
   */
  public getOptimizedUrl(publicId: string, options: Record<string, any> = {}): string {
    this.init();
    const defaults = {
      fetch_format: "auto",
      quality: "auto",
      secure: true,
    };
    return cloudinary.url(publicId, Object.assign({}, defaults, options));
  }

  /**
   * Direct access to the raw Cloudinary SDK instance.
   */
  public get client() {
    this.init();
    return cloudinary;
  }
}

export const cloudinaryService = new CloudinaryService();
