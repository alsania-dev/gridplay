"use client"

import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { GameController } from "@/components/game-controller"
import type { BoardType, SportType } from "@/lib/types"
import { SPORT_LABELS } from "@/lib/types"
import { BoardSetup } from "@/components/board-setup"

function PlayContent() {
  const searchParams = useSearchParams()

  const sport = searchParams.get("sport") as SportType | null
  const homeTeam = searchParams.get("home")
  const awayTeam = searchParams.get("away")
  const boardType = searchParams.get("board") as BoardType | null
  const squarePrice = Number(searchParams.get("price")) || 5

  const isConfigured = sport && homeTeam && awayTeam && boardType

  if (!isConfigured) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-10">
        <div className="rounded-2xl border border-border bg-card p-6 md:p-10">
          <h2 className="mb-2 text-center font-[family-name:var(--font-space-grotesk)] text-2xl font-bold tracking-tight">
            Set Up Your Board
          </h2>
          <p className="mb-8 text-center text-sm text-muted-foreground">
            Configure your game to start playing.
          </p>
          <BoardSetup />
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6">
      {/* Game header */}
      <div className="mb-6 text-center">
        <span className="mb-1 inline-block rounded-full bg-[var(--gp-neon)]/10 px-3 py-1 text-xs font-medium text-[color:var(--gp-neon)]">
          {SPORT_LABELS[sport] || sport.toUpperCase()}
        </span>
        <h1 className="font-[family-name:var(--font-space-grotesk)] text-2xl font-bold tracking-tight sm:text-3xl">
          {awayTeam} @ {homeTeam}
        </h1>
      </div>

      <GameController
        sport={sport}
        homeTeam={homeTeam}
        awayTeam={awayTeam}
        boardType={boardType}
        squarePrice={squarePrice}
      />
    </div>
  )
}

export default function PlayPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main className="flex-1">
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground border-t-[var(--gp-neon)]" />
            </div>
          }
        >
          <PlayContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}
