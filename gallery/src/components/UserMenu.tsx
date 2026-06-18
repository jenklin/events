'use client'
import { useState, useEffect, useRef } from 'react'

interface UserMenuProps {
  basePath?: string
}

export function UserMenu({ basePath = '' }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [userName, setUserName] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Fetch current user info
    fetch(`${basePath}/api/auth/me`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setUserEmail(data.email)
          setUserName(data.name)
        }
      })
      .catch(() => {})
  }, [basePath])

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    await fetch(`${basePath}/api/auth/logout`, { method: 'POST' })
    window.location.href = `${basePath}/login`
  }

  if (!userEmail) return null

  return (
    <div className="relative" ref={menuRef}>
      {/* User Avatar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-paradigm-panel transition"
        aria-label="User menu"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-paradigm-purple to-paradigm-teal flex items-center justify-center text-white text-sm font-semibold">
          {(userName || userEmail).charAt(0).toUpperCase()}
        </div>
        <svg
          className={`w-4 h-4 text-paradigm-muted transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-paradigm-panel rounded-lg shadow-lg border border-white/10 py-2 z-50">
          {/* User Info */}
          <div className="px-4 py-3 border-b border-white/10">
            <p className="text-sm font-medium text-white">{userName || 'User'}</p>
            <p className="text-xs text-paradigm-muted truncate">{userEmail}</p>
          </div>

          {/* Sign Out Button */}
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}
