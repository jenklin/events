'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Footer } from '@/components/Footer'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [content, setContent] = useState({
    title: 'Your Memories Await',
    subtitle: 'Sign in to see photos from our Red Helicopter gathering'
  })
  const searchParams = useSearchParams()
  const albumId = searchParams.get('albumId') || 'ffd8e9fc-cea4-4c8c-9918-9af167a7304d'

  // Fetch editable content on mount
  useEffect(() => {
    const fetchContent = async () => {
      try {
        // Build API URL with albumId for album-specific content
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || ''
        const apiUrl = `${baseUrl}/api/content?category=gallery&albumId=${albumId}`

        const res = await fetch(apiUrl)
        if (res.ok) {
          const data = await res.json()
          if (data.content) {
            setContent({
              title: data.content.gallery_login_title || content.title,
              subtitle: data.content.gallery_login_subtitle || content.subtitle
            })
          }
        }
      } catch (err) {
        console.error('Failed to fetch content:', err)
        // Use defaults if fetch fails
      }
    }
    fetchContent()
  }, [albumId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Use absolute URL to work with Cloudflare Worker proxy
      const apiUrl = process.env.NEXT_PUBLIC_APP_URL
        ? `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/send-magic-link`
        : '/api/auth/send-magic-link'

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, albumId })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Email not found in our records')
        setLoading(false)
        return
      }

      setSuccess(true)
    } catch (err) {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-paradigm-deep-black bg-gradient-to-br from-paradigm-deep-black via-[#0b0a14] to-paradigm-deep-black flex flex-col">
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="max-w-md w-full glass-panel bg-paradigm-panel/80 border border-white/10 rounded-2xl shadow-2xl p-8">
          {!success ? (
            <>
              <div className="text-center mb-8">
                <img src="/logo-multi-color.svg" alt="cloudpeers" className="h-8 w-auto mx-auto mb-6" />
                <div className="w-16 h-16 bg-gradient-to-br from-paradigm-purple to-paradigm-teal rounded-full mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h1 className="text-3xl font-bold text-white mb-2">{content.title}</h1>
                <p className="text-paradigm-muted">{content.subtitle}</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-paradigm-text mb-2">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full px-4 py-3 bg-paradigm-dark border border-white/10 rounded-lg focus:ring-2 focus:ring-paradigm-purple focus:border-transparent outline-none text-white placeholder:text-paradigm-muted"
                  />
                  <p className="mt-2 text-sm text-paradigm-muted">
                    Use the email you registered with on seoul.redheli.com, beta.redheli.com, or hover.redheli.com
                  </p>
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                    <div className="flex gap-2">
                      <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      <p className="text-sm text-red-300">{error}</p>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-paradigm-purple text-white rounded-lg font-semibold hover:bg-paradigm-purple-light transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Verifying...
                    </>
                  ) : (
                    'Send Magic Link'
                  )}
                </button>
              </form>

              <div className="mt-6 pt-6 border-t border-white/10">
                <p className="text-sm text-paradigm-muted text-center">
                  Don't have access?{' '}
                  <a href="https://seoul.redheli.com#register" className="text-paradigm-purple-light hover:text-paradigm-purple font-medium">
                    Register here
                  </a>
                </p>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-paradigm-teal rounded-full mx-auto mb-4 flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Check Your Email</h2>
              <p className="text-paradigm-muted mb-4">
                We've sent a magic link to <strong>{email}</strong>
              </p>
              <p className="text-sm text-paradigm-muted mb-6">
                Click the link in your email to access the gallery. The link expires in 15 minutes.
              </p>
              <button
                onClick={() => {
                  setSuccess(false)
                  setEmail('')
                }}
                className="text-paradigm-purple-light hover:text-paradigm-purple font-medium text-sm"
              >
                Try a different email
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Footer at bottom of screen */}
      <Footer />
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-paradigm-deep-black flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
