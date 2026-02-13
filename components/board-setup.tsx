"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Grid3X3,
  LayoutGrid,
  Zap,
  ChevronRight,
  DollarSign,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { BoardType, SportType } from "@/lib/types"
import { SPORT_LABELS } from "@/lib/types"

const BOARD_OPTIONS: {
  value: BoardType
  label: string
  description: string
  icon: typeof Grid3X3
  squares: number
}[] = [
  {
    value: "shotgun",
    label: "Shotgun Board",
    description: "2-row quick play. Halftime + Final.",
    icon: Zap,
    squares: 20,
  },
  {
    value: "5x5",
    label: "5x5 Grid",
    description: "25 squares with double-digit columns.",
    icon: LayoutGrid,
    squares: 25,
  },
  {
    value: "10x10",
    label: "10x10 Grid",
    description: "Classic 100 squares. The full experience.",
    icon: Grid3X3,
    squares: 100,
  },
]

const PRICE_OPTIONS = [1, 2, 5, 10, 20, 50]

export function BoardSetup() {
  const router = useRouter()
  const [sport, setSport] = useState<SportType | "">("")
  const [homeTeam, setHomeTeam] = useState("")
  const [awayTeam, setAwayTeam] = useState("")
  const [boardType, setBoardType] = useState<BoardType | "">("")
  const [squarePrice, setSquarePrice] = useState<number>(5)
  const [step, setStep] = useState(0)

  const canProceed =
    sport !== "" && homeTeam.trim() !== "" && awayTeam.trim() !== ""

  function handleCreate() {
    if (!boardType || !sport || !homeTeam || !awayTeam) return
    const params = new URLSearchParams({
      sport,
      home: homeTeam,
      away: awayTeam,
      board: boardType,
      price: squarePrice.toString(),
    })
    router.push(`/play?${params.toString()}`)
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      {/* Step 0: Sport and Teams */}
      {step === 0 && (
        <div className="flex flex-col gap-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-muted-foreground">
              Select Sport
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {(Object.keys(SPORT_LABELS) as SportType[]).map((key) => (
                <button
                  key={key}
                  onClick={() => setSport(key)}
                  className={cn(
                    "rounded-lg border px-4 py-3 text-sm font-medium transition-all",
                    sport === key
                      ? "border-[var(--gp-neon)] bg-[var(--gp-neon)]/10 text-[color:var(--gp-neon)]"
                      : "border-border bg-card text-muted-foreground hover:border-muted-foreground/30 hover:text-foreground"
                  )}
                >
                  {SPORT_LABELS[key]}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-muted-foreground">
                Home Team
              </label>
              <input
                type="text"
                placeholder="e.g. Chiefs"
                value={homeTeam}
                onChange={(e) => setHomeTeam(e.target.value)}
                className="h-11 w-full rounded-lg border border-border bg-input px-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-[var(--gp-neon)] focus:outline-none focus:ring-1 focus:ring-[var(--gp-neon)]"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-muted-foreground">
                Away Team
              </label>
              <input
                type="text"
                placeholder="e.g. Eagles"
                value={awayTeam}
                onChange={(e) => setAwayTeam(e.target.value)}
                className="h-11 w-full rounded-lg border border-border bg-input px-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-[var(--gp-neon)] focus:outline-none focus:ring-1 focus:ring-[var(--gp-neon)]"
              />
            </div>
          </div>

          <button
            onClick={() => setStep(1)}
            disabled={!canProceed}
            className={cn(
              "inline-flex h-12 items-center justify-center gap-2 rounded-lg px-6 text-sm font-semibold transition-all",
              canProceed
                ? "bg-[var(--gp-neon)] text-[var(--primary-foreground)] hover:opacity-90"
                : "cursor-not-allowed bg-secondary text-muted-foreground"
            )}
          >
            Next: Choose Board
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Step 1: Board type */}
      {step === 1 && (
        <div className="flex flex-col gap-6">
          <button
            onClick={() => setStep(0)}
            className="self-start text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            &larr; Back to teams
          </button>

          <p className="text-center text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{awayTeam}</span>
            {" @ "}
            <span className="font-medium text-foreground">{homeTeam}</span>
          </p>

          <div className="flex flex-col gap-3">
            {BOARD_OPTIONS.map((opt) => {
              const Icon = opt.icon
              return (
                <button
                  key={opt.value}
                  onClick={() => setBoardType(opt.value)}
                  className={cn(
                    "flex items-center gap-4 rounded-xl border p-4 text-left transition-all",
                    boardType === opt.value
                      ? "border-[var(--gp-neon)] bg-[var(--gp-neon)]/5"
                      : "border-border bg-card hover:border-muted-foreground/30"
                  )}
                >
                  <div
                    className={cn(
                      "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg",
                      boardType === opt.value
                        ? "bg-[var(--gp-neon)]/15 text-[color:var(--gp-neon)]"
                        : "bg-secondary text-muted-foreground"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{opt.label}</p>
                    <p className="text-sm text-muted-foreground">
                      {opt.description}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {opt.squares} squares
                  </span>
                </button>
              )
            })}
          </div>

          {boardType && (
            <div>
              <label className="mb-2 block text-sm font-medium text-muted-foreground">
                Price Per Square
              </label>
              <div className="flex flex-wrap gap-2">
                {PRICE_OPTIONS.map((p) => (
                  <button
                    key={p}
                    onClick={() => setSquarePrice(p)}
                    className={cn(
                      "inline-flex h-10 items-center gap-1 rounded-lg border px-4 text-sm font-medium transition-all",
                      squarePrice === p
                        ? "border-[var(--gp-neon)] bg-[var(--gp-neon)]/10 text-[color:var(--gp-neon)]"
                        : "border-border bg-card text-muted-foreground hover:border-muted-foreground/30 hover:text-foreground"
                    )}
                  >
                    <DollarSign className="h-3.5 w-3.5" />
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          {boardType && (
            <button
              onClick={handleCreate}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[var(--gp-neon)] px-6 text-sm font-semibold text-[var(--primary-foreground)] transition-all hover:opacity-90 animate-pulse-glow"
            >
              Launch Board
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>
      )}
    </div>
  )
}
