import { supabaseAdmin } from '@/lib/supabase'

export async function requireAdminFromAuthHeader(req: Request) {
  const auth = req.headers.get('authorization') || ''
  const m = auth.match(/^Bearer\s+(.+)$/i)
  if (!m) return null
  const token = m[1]
  const { data, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !data?.user) return null
  const allowed = (process.env.ADMIN_EMAILS || '').split(',').map(s=>s.trim()).filter(Boolean)
  if (allowed.length && !allowed.includes(data.user.email || '')) return null
  return data.user
}
