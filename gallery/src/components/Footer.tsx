import packageJson from '../../package.json'

export function Footer() {
  return (
    <footer className="py-6 text-center text-sm text-paradigm-muted border-t border-white/10">
      <p className="flex items-center justify-center gap-2">
        <img src="/logo-multi-color.svg" alt="cloudpeers" className="h-4 w-auto opacity-90" />
        <span>cloudpeers Events Gallery v{packageJson.version}</span>
      </p>
      <p className="mt-1 text-xs text-paradigm-muted/70">
        © {new Date().getFullYear()} cloudpeers. All rights reserved.
      </p>
    </footer>
  )
}
