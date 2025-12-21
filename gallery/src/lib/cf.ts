import jwt from 'jsonwebtoken'

export const CF_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID!
export const CF_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN!
export const CF_IMAGES_ACCOUNT_HASH = process.env.CF_IMAGES_ACCOUNT_HASH!

export async function cfImagesCreateDirectUpload(filename: string, metadata?: Record<string,string>) {
  // Cloudflare Images v2 API requires form data, not JSON
  const formData = new FormData()
  if (metadata) {
    formData.append('metadata', JSON.stringify(metadata))
  }

  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/images/v2/direct_upload`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${CF_API_TOKEN}` },
    body: formData
  })
  const json = await res.json()
  if (!json.success) throw new Error('CF Images direct upload failed: ' + JSON.stringify(json))
  return json.result as { id: string, uploadURL: string }
}

export async function cfStreamCreateDirectUpload() {
  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/stream/direct_upload`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${CF_API_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ maxDurationSeconds: 3600 })
  })
  const json = await res.json()
  if (!json.success) throw new Error('CF Stream direct upload failed: ' + JSON.stringify(json))
  return json.result as { uploadURL: string, uid: string }
}

export function signInviteCookie(payload: { albumId: string; role: 'viewer'|'editor'; allowComments: boolean; download: boolean }) {
  return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '7d' })
}

export function verifyInviteCookie(token: string): { albumId: string; role: string; allowComments: boolean; download: boolean } | null {
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as any
    return payload
  } catch (err) {
    return null
  }
}
