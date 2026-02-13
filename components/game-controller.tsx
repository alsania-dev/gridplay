"use client"

import { useState, useCallback, useMemo } from "react"
import { Lock, Play, RotateCcw, Users, Timer } from "lucide-react"
import { cn } from "@/lib/utils"
import type { BoardType, SportType, BoardSquare, QuarterScore } from "@/lib/types"
import { QUARTER_LABELS } from "@/lib/types"
import {
  createBoard,
  generateNumbers,
  simulateScores,
  findWinningSquare,
  findShotgunWinner,
} from "@/lib/game"
import { Scoreboard } from "./scoreboard"
import { Grid10x10 } from "./grid-10x10"
import { Grid5x5 } from "./grid-5x5"
import { GridShotgun } from "./grid-shotgun"
import { ResultsPanel } from "./results-panel"

interface GameControllerProps {
  sport: SportType
  homeTeam: string
  awayTeam: string
  boardType: BoardType
  squarePrice: number
}

export function GameController({
  sport,
  homeTeam,
  awayTeam,
  boardType,
  squarePrice,
}: GameControllerProps) {
  const quarterLabels = QUARTER_LABELS[sport] || QUARTER_LABELS.other
  const gridSize = boardType === "10x10" ? 10 : 5

  const [squares, setSquares] = useState<BoardSquare[]>(() =>
    createBoard(boardType)
  )
  const [columnNumbers] = useState<number[]>(() =>
    boardType === "shotgun" ? generateNumbers(10) : generateNumbers(gridSize)
  )
  const [rowNumbers] = useState<number[]>(() =>
    boardType === "shotgun" ? [] : generateNumbers(gridSize)
  )
  const [isLocked, setIsLocked] = useState(false)
  const [scores, setScores] = useState<QuarterScore[]>([])
  const [currentQuarter, setCurrentQuarter] = useState(0)
  const [winningQuarters, setWinningQuarters] = useState<number[]>([])
  const [gamePhase, setGamePhase] = useState<"select" | "locked" | "playing" | "finished">("select")

  const selectedCount = useMemo(
    () => squares.filter((s) => s.isSelected).length,
    [squares]
  )

  const handleSquareClick = useCallback(
    (index: number) => {
      if (isLocked) return
      setSquares((prev) =>
        prev.map((s) =>
          s.index === index
            ? { ...s, isSelected: !s.isSelected, owner: !s.isSelected ? "You" : undefined }
            : s
        )
      )
    },
    [isLocked]
  )

  const handleLockIn = useCallback(() => {
    if (selectedCount === 0) return
    setIsLocked(true)
    setGamePhase("locked")
  }, [selectedCount])

  const handleSimulate = useCallback(() => {
    const simScores = simulateScores()
    setScores(simScores)
    setGamePhase("playing")

    // Determine winners quarter by quarter
    const newSquares = [...squares]
    const wonQuarters: number[] = []

    simScores.forEach((score, qi) => {
      if (boardType === "shotgun") {
        // Shotgun: row 0 (0-9) = Halftime (qi=1), row 1 (10-19) = Final (qi=3)
        const winNum = findShotgunWinner(score.home, score.away)
        let rowOffset = -1
        if (qi === 1) rowOffset = 0    // halftime winner in top row
        if (qi === 3) rowOffset = 10   // final winner in bottom row
        if (rowOffset === -1) return   // Q1 and Q3 don't pay in shotgun

        const winIdx = rowOffset + winNum
        if (winIdx >= 0 && winIdx < newSquares.length) {
          newSquares[winIdx] = {
            ...newSquares[winIdx],
            isWinner: true,
            winQuarter: qi + 1,
          }
          if (newSquares[winIdx].isSelected) {
            wonQuarters.push(qi)
          }
        }
      } else {
        const winIdx = findWinningSquare(
          score.home,
          score.away,
          columnNumbers,
          rowNumbers,
          boardType
        )
        if (winIdx >= 0 && winIdx < newSquares.length) {
          newSquares[winIdx] = {
            ...newSquares[winIdx],
            isWinner: true,
            winQuarter: qi + 1,
          }
          if (newSquares[winIdx].isSelected) {
            wonQuarters.push(qi)
          }
        }
      }
    })

    setSquares(newSquares)
    setWinningQuarters(wonQuarters)
    setCurrentQuarter(4)
    setGamePhase("finished")
  }, [squares, boardType, columnNumbers, rowNumbers])

  const handleReset = useCallback(() => {
    setSquares(createBoard(boardType))
    setScores([])
    setCurrentQuarter(0)
    setWinningQuarters([])
    setIsLocked(false)
    setGamePhase("select")
  }, [boardType])

  return (
    <div className="flex flex-col gap-6">
      {/* Game info bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 sm:px-5">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span className="font-medium">{selectedCount} selected</span>
          </div>
          <div className="h-4 w-px bg-border" />
          <span className="text-sm text-muted-foreground">
            {boardType.toUpperCase()} Board
          </span>
          <div className="h-4 w-px bg-border" />
          <span className="text-sm font-medium text-[color:var(--gp-neon)]">
            ${squarePrice}/sq
          </span>
        </div>

        <div className="flex items-center gap-2">
          {gamePhase === "select" && (
            <button
              onClick={handleLockIn}
              disabled={selectedCount === 0}
              className={cn(
                "inline-flex h-9 items-center gap-2 rounded-lg px-4 text-sm font-semibold transition-all",
                selectedCount > 0
                  ? "bg-[var(--gp-neon)] text-[var(--primary-foreground)] hover:opacity-90"
                  : "cursor-not-allowed bg-secondary text-muted-foreground"
              )}
            >
              <Lock className="h-3.5 w-3.5" />
              Lock In
            </button>
          )}
          {gamePhase === "locked" && (
            <button
              onClick={handleSimulate}
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-[var(--gp-neon)] px-4 text-sm font-semibold text-[var(--primary-foreground)] transition-all hover:opacity-90 animate-pulse-glow"
            >
              <Play className="h-3.5 w-3.5" />
              Start Game
            </button>
          )}
          {gamePhase === "finished" && (
            <button
              onClick={handleReset}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-border px-4 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              New Game
            </button>
          )}
        </div>
      </div>

      {/* Scoreboard */}
      <Scoreboard
        homeTeam={homeTeam}
        awayTeam={awayTeam}
        scores={scores}
        currentQuarter={currentQuarter}
        quarterLabels={quarterLabels}
      />

      {/* Game phase indicators */}
      {gamePhase === "select" && (
        <div className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-card/50 px-4 py-3 text-sm text-muted-foreground">
          <Timer className="h-4 w-4" />
          Tap squares to claim them, then Lock In.
        </div>
      )}

      {gamePhase === "locked" && (
        <div className="flex items-center justify-center gap-2 rounded-lg border border-[var(--gp-neon)]/30 bg-[var(--gp-neon)]/5 px-4 py-3 text-sm text-[color:var(--gp-neon)]">
          <Lock className="h-4 w-4" />
          Squares locked. Press Start Game to simulate.
        </div>
      )}

      {/* Grid */}
      {boardType === "10x10" && (
        <Grid10x10
          squares={squares}
          columnNumbers={columnNumbers}
          rowNumbers={rowNumbers}
          homeTeam={homeTeam}
          awayTeam={awayTeam}
          onSquareClick={handleSquareClick}
          isLocked={isLocked}
        />
      )}
      {boardType === "5x5" && (
        <Grid5x5
          squares={squares}
          columnNumbers={columnNumbers}
          rowNumbers={rowNumbers}
          homeTeam={homeTeam}
          awayTeam={awayTeam}
          onSquareClick={handleSquareClick}
          isLocked={isLocked}
        />
      )}
      {boardType === "shotgun" && (
        <GridShotgun
          squares={squares}
          columnNumbers={columnNumbers}
          onSquareClick={handleSquareClick}
          isLocked={isLocked}
          quarterLabels={quarterLabels}
        />
      )}

      {/* Results */}
      {gamePhase === "finished" && (
        <ResultsPanel
          scores={scores}
          winningQuarters={winningQuarters}
          boardType={boardType}
          squarePrice={squarePrice}
          quarterLabels={quarterLabels}
        />
      )}
    </div>
  )
}
