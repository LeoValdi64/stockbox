import { Client } from "minio";

const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT || "localhost",
  port: parseInt(process.env.MINIO_PORT || "9000"),
  useSSL: process.env.MINIO_USE_SSL === "true",
  accessKey: process.env.MINIO_ACCESS_KEY || "",
  secretKey: process.env.MINIO_SECRET_KEY || "",
});

export const MINIO_BUCKET = process.env.MINIO_BUCKET || "product-images";
export const MINIO_PUBLIC_URL = process.env.NEXT_PUBLIC_MINIO_URL || "http://localhost:9000";

export { minioClient };
