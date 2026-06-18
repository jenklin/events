/**
 * Provider-agnostic asset URL resolution.
 *
 * Centralizes how a stored asset row maps to a deliverable media URL so the
 * gallery is not hardcoded to Cloudflare. Today's assets live on Cloudflare
 * Images (Seoul album); future assets may live on Google Cloud Storage (GCS)
 * or Cloudflare Stream. The `provider` column on `assets` selects the backend.
 *
 * Backward-compatible: when `asset.provider` is null/absent we DEFAULT to
 * 'cloudflare-images', so existing rows (e.g. the 60 Seoul Cloudflare assets)
 * render exactly as before.
 *
 * GCS resolution is async (signed URLs), so getAssetUrl/getThumbUrl are async
 * and intended to run SERVER-SIDE (the assets API route computes url/thumbUrl
 * per item). The Cloudflare/Stream branches are pure string templates and work
 * anywhere; only the GCS branch needs server credentials.
 */

import { generateSignedUrl } from './gcsSignedUrls'

export type AssetProvider = 'cloudflare-images' | 'cloudflare-stream' | 'gcs'

export interface ResolvableAsset {
  provider?: string | null
  provider_id: string
  type?: 'image' | 'video' | string
}

const CF_IMAGES_HASH = process.env.NEXT_PUBLIC_CF_IMAGES_HASH

function resolveProvider(asset: ResolvableAsset): AssetProvider {
  // Default keeps existing (Cloudflare Images) rows working when provider is unset.
  return (asset.provider as AssetProvider) || 'cloudflare-images'
}

function cloudflareImagesUrl(providerId: string, variant: string): string {
  return `https://imagedelivery.net/${CF_IMAGES_HASH}/${providerId}/${variant}`
}

function cloudflareStreamUrl(providerId: string): string {
  return `https://videodelivery.net/${providerId}/manifest/video.m3u8`
}

/**
 * Resolve the full-size / playable URL for an asset.
 * @param asset   Row with provider + provider_id.
 * @param variant Cloudflare Images variant (ignored by other providers).
 */
export async function getAssetUrl(
  asset: ResolvableAsset,
  variant: string = 'public'
): Promise<string> {
  const provider = resolveProvider(asset)

  switch (provider) {
    case 'cloudflare-stream':
      return cloudflareStreamUrl(asset.provider_id)

    case 'gcs':
      // provider_id is treated as the GCS object path. Signed read URL.
      return generateSignedUrl(asset.provider_id, { action: 'read' })

    case 'cloudflare-images':
    default:
      return cloudflareImagesUrl(asset.provider_id, variant)
  }
}

/**
 * Resolve a thumbnail URL for grid display.
 * Cloudflare Images uses the same delivery host with a 'thumbnail' variant
 * (falls back to 'public' implicitly if that variant isn't defined on the
 * account). GCS/Stream reuse getAssetUrl for now.
 */
export async function getThumbUrl(asset: ResolvableAsset): Promise<string> {
  const provider = resolveProvider(asset)

  if (provider === 'cloudflare-images') {
    return cloudflareImagesUrl(asset.provider_id, 'thumbnail')
  }
  return getAssetUrl(asset)
}
