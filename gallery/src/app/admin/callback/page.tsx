'use client'
import { useEffect, useState } from 'react'
import { supabaseClient } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function Callback() {
  const supa = supabaseClient()
  const router = useRouter()
  const [status, setStatus] = useState('Completing sign-in...')

  useEffect(() => {
    supa.auth.getSession().then(async ({ data }) => {
      if (!data.session) {
        // For PKCE / code flow links
        try {
          const { error } = await supa.auth.exchangeCodeForSession(window.location.href)
          if (error) setStatus('Error: ' + error.message)
          else router.replace('/admin')
        } catch (e:any) {
          setStatus('Error: ' + (e?.message || 'failed'))
        }
      } else {
        router.replace('/admin')
      }
    })
  }, [])

  return <main className="p-6 text-sm text-neutral-600">{status}</main>
}
