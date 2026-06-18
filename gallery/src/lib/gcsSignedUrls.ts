/**
 * Google Cloud Storage with Signed URLs
 * Provides secure, time-limited access to private images
 */

import { Storage } from '@google-cloud/storage';
import path from 'path';

// Initialize GCS client
let storage: Storage | null = null;

function getStorage(): Storage {
  if (storage) return storage;

  const keyFile = process.env.GCS_KEY_FILE;
  const credentialsBase64 = process.env.GCS_CREDENTIALS_BASE64;

  if (credentialsBase64) {
    // Production: Use base64 encoded credentials (if provided)
    const credentials = JSON.parse(
      Buffer.from(credentialsBase64, 'base64').toString('utf-8')
    );
    storage = new Storage({ credentials });
  } else if (keyFile && require('fs').existsSync(keyFile)) {
    // Development: Use key file (if exists)
    storage = new Storage({ keyFilename: keyFile });
  } else {
    // Workload Identity / Application Default Credentials
    // This works in Cloud Run, GKE, and other GCP compute environments
    console.log('Using Application Default Credentials (Workload Identity)');
    storage = new Storage();
  }

  return storage;
}

const BUCKET_NAME = process.env.GCS_BUCKET_NAME || '';
const DEFAULT_EXPIRATION = parseInt(process.env.GCS_SIGNED_URL_EXPIRATION || '86400', 10); // 24 hours

export interface UploadOptions {
  file: Buffer | string; // Buffer or file path
  destination: string; // Path in bucket (e.g., "images/photo-123.jpg")
  contentType?: string;
  metadata?: Record<string, string>;
}

export interface SignedUrlOptions {
  action: 'read' | 'write' | 'delete';
  expires?: number; // Milliseconds from now
  contentType?: string;
}

/**
 * Upload a file to GCS
 */
export async function uploadToGCS(options: UploadOptions): Promise<string> {
  const { file, destination, contentType, metadata } = options;

  if (!BUCKET_NAME) {
    throw new Error('GCS_BUCKET_NAME not configured');
  }

  const gcs = getStorage();
  const bucket = gcs.bucket(BUCKET_NAME);
  const blob = bucket.file(destination);

  const uploadOptions: any = {
    metadata: {
      contentType: contentType || 'application/octet-stream',
      metadata: metadata || {},
    },
  };

  if (typeof file === 'string') {
    // Upload from file path
    await bucket.upload(file, {
      destination,
      ...uploadOptions,
    });
  } else {
    // Upload from buffer
    await blob.save(file, uploadOptions);
  }

  return destination;
}

/**
 * Generate a signed URL for a file in GCS
 */
export async function generateSignedUrl(
  filePath: string,
  options: SignedUrlOptions = { action: 'read' }
): Promise<string> {
  if (!BUCKET_NAME) {
    throw new Error('GCS_BUCKET_NAME not configured');
  }

  const gcs = getStorage();
  const bucket = gcs.bucket(BUCKET_NAME);
  const file = bucket.file(filePath);

  const expires = options.expires || Date.now() + DEFAULT_EXPIRATION * 1000;

  const [url] = await file.getSignedUrl({
    version: 'v4',
    action: options.action,
    expires,
    ...(options.contentType && { contentType: options.contentType }),
  });

  return url;
}

/**
 * Generate signed URLs for multiple files
 */
export async function generateSignedUrls(
  filePaths: string[],
  options: SignedUrlOptions = { action: 'read' }
): Promise<Record<string, string>> {
  const urls: Record<string, string> = {};

  await Promise.all(
    filePaths.map(async (filePath) => {
      urls[filePath] = await generateSignedUrl(filePath, options);
    })
  );

  return urls;
}

/**
 * Delete a file from GCS
 */
export async function deleteFromGCS(filePath: string): Promise<void> {
  if (!BUCKET_NAME) {
    throw new Error('GCS_BUCKET_NAME not configured');
  }

  const gcs = getStorage();
  const bucket = gcs.bucket(BUCKET_NAME);
  await bucket.file(filePath).delete();
}

/**
 * Check if file exists in GCS
 */
export async function fileExists(filePath: string): Promise<boolean> {
  if (!BUCKET_NAME) {
    throw new Error('GCS_BUCKET_NAME not configured');
  }

  const gcs = getStorage();
  const bucket = gcs.bucket(BUCKET_NAME);
  const [exists] = await bucket.file(filePath).exists();
  return exists;
}

/**
 * Get file metadata from GCS
 */
export async function getFileMetadata(filePath: string): Promise<any> {
  if (!BUCKET_NAME) {
    throw new Error('GCS_BUCKET_NAME not configured');
  }

  const gcs = getStorage();
  const bucket = gcs.bucket(BUCKET_NAME);
  const [metadata] = await bucket.file(filePath).getMetadata();
  return metadata;
}

/**
 * Generate a unique file path for an upload
 */
export function generateFilePath(albumId: string, filename: string): string {
  const ext = path.extname(filename);
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  return `albums/${albumId}/${timestamp}-${random}${ext}`;
}

/**
 * Check if GCS is properly configured
 */
export function isGCSConfigured(): boolean {
  return !!(
    BUCKET_NAME &&
    (process.env.GCS_KEY_FILE || process.env.GCS_CREDENTIALS_BASE64)
  );
}
