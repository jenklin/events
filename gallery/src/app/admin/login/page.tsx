'use client'
import { useEffect, useState } from 'react'
import { supabaseClient } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function Login() {
  const supa = supabaseClient()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('')

  const submit = async () => {
    setStatus('Sending magic link...')
    const { error } = await supa.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/admin/callback` }
    })
    setStatus(error ? 'Error: ' + error.message : 'Check your email for a magic link.')
  }

  useEffect(() => {
    supa.auth.getSession().then(({ data }) => { if (data.session) router.push('/admin') })
  }, [])

  return (
    <main className="space-y-4">
      <h1 className="text-2xl font-semibold">Admin Login</h1>
      <div className="flex gap-2">
        <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" className="border rounded px-2 py-1 text-sm" />
        <button onClick={submit} className="rounded bg-black text-white px-3 py-1 text-sm">Send link</button>
      </div>
      <div className="text-sm text-neutral-600">{status}</div>
    </main>
  )
}
