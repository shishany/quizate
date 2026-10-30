import { CreateBucketCommand, HeadBucketCommand, S3Client } from '@aws-sdk/client-s3';

/** Makes sure the test bucket exists in the local S3-compatible store. */
export async function ensureBucket(): Promise<void> {
  const s3 = new S3Client({
    endpoint: process.env.S3_ENDPOINT,
    region: process.env.S3_REGION,
    forcePathStyle: true,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY ?? '',
      secretAccessKey: process.env.S3_SECRET_KEY ?? '',
    },
  });
  const Bucket = process.env.S3_BUCKET;
  try {
    await s3.send(new HeadBucketCommand({ Bucket }));
  } catch {
    await s3.send(new CreateBucketCommand({ Bucket }));
  } finally {
    s3.destroy();
  }
}
