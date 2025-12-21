/**
 * Cloudflare Images Signed URLs
 * Generates time-limited signed URLs for private image access
 */

import crypto from 'crypto';

const SIGNING_KEY_ID = process.env.CF_IMAGES_SIGNING_KEY_ID;
const SIGNING_KEY_SECRET = process.env.CF_IMAGES_SIGNING_KEY_SECRET;
const IMAGES_HASH = process.env.NEXT_PUBLIC_CF_IMAGES_HASH;

interface SignedUrlOptions {
  imageId: string;
  variant?: string;
  expiresIn?: number; // seconds, default 24 hours
}

/**
 * Generate a signed URL for a Cloudflare Image
 * @param options - Image ID, variant, and expiration
 * @returns Signed URL string
 */
export function generateSignedImageUrl(options: SignedUrlOptions): string {
  const {
    imageId,
    variant = 'public',
    expiresIn = 24 * 60 * 60 // 24 hours default
  } = options;

  // If signing is not configured, return unsigned URL
  if (!SIGNING_KEY_ID || !SIGNING_KEY_SECRET) {
    console.warn('⚠️  Cloudflare signing keys not configured - returning unsigned URL');
    return `https://imagedelivery.net/${IMAGES_HASH}/${imageId}/${variant}`;
  }

  // Calculate expiration timestamp
  const now = Math.floor(Date.now() / 1000);
  const exp = now + expiresIn;

  // Build the URL path to sign
  const urlPath = `/${imageId}/${variant}`;

  // Create signature
  // Format: exp + urlPath
  const stringToSign = `${exp}${urlPath}`;

  const signature = crypto
    .createHmac('sha256', SIGNING_KEY_SECRET)
    .update(stringToSign)
    .digest('base64url');

  // Build signed URL
  // Format: https://imagedelivery.net/{account_hash}/{image_id}/{variant}?exp={exp}&sig={signature}
  const signedUrl = `https://imagedelivery.net/${IMAGES_HASH}${urlPath}?exp=${exp}&sig=${signature}`;

  return signedUrl;
}

/**
 * Check if signed URLs are configured
 */
export function isSignedUrlsEnabled(): boolean {
  return !!(SIGNING_KEY_ID && SIGNING_KEY_SECRET);
}

/**
 * Get image URL (signed if keys are configured, unsigned otherwise)
 */
export function getImageUrl(imageId: string, variant: string = 'public'): string {
  if (isSignedUrlsEnabled()) {
    return generateSignedImageUrl({ imageId, variant });
  }
  return `https://imagedelivery.net/${IMAGES_HASH}/${imageId}/${variant}`;
}

/**
 * Batch generate signed URLs for multiple images
 */
export function generateSignedImageUrls(imageIds: string[], variant: string = 'public'): Record<string, string> {
  const urls: Record<string, string> = {};

  for (const imageId of imageIds) {
    urls[imageId] = getImageUrl(imageId, variant);
  }

  return urls;
}
