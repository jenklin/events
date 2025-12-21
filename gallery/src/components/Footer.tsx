import packageJson from '../../package.json'

export function Footer() {
  return (
    <footer className="py-6 text-center text-sm text-white/70 border-t border-white/10">
      <p>
        Seoul Events Gallery v{packageJson.version}
      </p>
      <p className="mt-1 text-xs text-white/50">
        © {new Date().getFullYear()} Red Helicopter. All rights reserved.
      </p>
    </footer>
  )
}
