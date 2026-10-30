import { S3Client } from "@aws-sdk/client-s3";

class R2ConfigurationError extends Error {
  status = 503;

  constructor() {
    super("Le stockage Cloudflare R2 n'est pas configuré côté serveur.");
    this.name = "R2ConfigurationError";
  }
}

let client: S3Client | undefined;

export function getR2Bucket(): string {
  const bucket = process.env.R2_BUCKET_NAME;
  if (!bucket) throw new R2ConfigurationError();
  return bucket;
}

export function getR2Client(): S3Client {
  if (client) return client;

  const accountId = process.env.R2_ACCOUNT_ID || process.env.CLOUDFLARE_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!accountId || !accessKeyId || !secretAccessKey || !process.env.R2_BUCKET_NAME) {
    throw new R2ConfigurationError();
  }

  client = new S3Client({
    region: "auto",
    endpoint: process.env.R2_S3_ENDPOINT || `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
  return client;
}
