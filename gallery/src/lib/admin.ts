export function isAdmin(req: Request) {
  const token = process.env.ADMIN_TOKEN
  const hdr = (req.headers.get('x-admin-token') || '')
  return token && hdr && token === hdr
}
