import { Grid3X3 } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t border-border/50 bg-background">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-8 md:flex-row md:justify-between">
        <div className="flex items-center gap-2">
          <Grid3X3 className="h-4 w-4 text-[color:var(--gp-neon)]" />
          <span className="text-sm font-semibold font-[family-name:var(--font-space-grotesk)]">
            GridPlay
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} GridPlay. Digital Sports Squares
          Made Easy.
        </p>
      </div>
    </footer>
  )
}
