"use client"

import Link from "next/link"
import { Grid3X3, Menu, X } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--gp-neon)]/10 text-[color:var(--gp-neon)]">
            <Grid3X3 className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold tracking-tight font-[family-name:var(--font-space-grotesk)]">
            GridPlay
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 md:flex">
          <Link
            href="/"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Home
          </Link>
          <Link
            href="/play"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Play
          </Link>
          <Link
            href="/play"
            className="inline-flex h-9 items-center justify-center rounded-lg bg-[var(--gp-neon)] px-4 text-sm font-semibold text-[var(--primary-foreground)] transition-all hover:opacity-90"
          >
            Create Board
          </Link>
        </nav>

        {/* Mobile toggle */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:hidden"
          aria-label="Toggle menu"
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      <div
        className={cn(
          "overflow-hidden border-t border-border/50 bg-background transition-all duration-300 md:hidden",
          menuOpen ? "max-h-48" : "max-h-0 border-t-0"
        )}
      >
        <nav className="flex flex-col gap-1 p-4">
          <Link
            href="/"
            onClick={() => setMenuOpen(false)}
            className="rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            Home
          </Link>
          <Link
            href="/play"
            onClick={() => setMenuOpen(false)}
            className="rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            Play
          </Link>
          <Link
            href="/play"
            onClick={() => setMenuOpen(false)}
            className="mt-1 inline-flex h-10 items-center justify-center rounded-lg bg-[var(--gp-neon)] px-4 text-sm font-semibold text-[var(--primary-foreground)] transition-all hover:opacity-90"
          >
            Create Board
          </Link>
        </nav>
      </div>
    </header>
  )
}
