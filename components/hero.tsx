import { Grid3X3, Zap, Shield, Trophy } from "lucide-react"

const FEATURES = [
  {
    icon: Zap,
    title: "Instant Setup",
    desc: "Create a board in seconds. No spreadsheets, no stress.",
  },
  {
    icon: Shield,
    title: "Fair & Transparent",
    desc: "Randomized number assignment ensures equal odds for all.",
  },
  {
    icon: Trophy,
    title: "Auto Payouts",
    desc: "Winners highlighted in real time by quarter.",
  },
]

export function Hero() {
  return (
    <section className="flex flex-col items-center gap-10 px-4 pb-8 pt-12 text-center md:pt-20">
      {/* Badge */}
      <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground">
        <Grid3X3 className="h-3.5 w-3.5 text-[color:var(--gp-neon)]" />
        Digital Sports Squares
      </div>

      {/* Heading */}
      <div className="flex max-w-3xl flex-col gap-4">
        <h1 className="text-balance font-[family-name:var(--font-space-grotesk)] text-4xl font-bold leading-tight tracking-tight md:text-6xl">
          Your Grid. Their Game.{" "}
          <span className="text-[color:var(--gp-neon)]">Instant Glory.</span>
        </h1>
        <p className="mx-auto max-w-xl text-pretty text-base leading-relaxed text-muted-foreground md:text-lg">
          Pick your squares, lock in before kickoff, and watch the scoreboard
          decide your fate. Works with any four-quarter sport.
        </p>
      </div>

      {/* Feature cards */}
      <div className="grid w-full max-w-3xl gap-4 sm:grid-cols-3">
        {FEATURES.map((f) => {
          const Icon = f.icon
          return (
            <div
              key={f.title}
              className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-6 transition-colors hover:border-muted-foreground/30"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--gp-neon)]/10 text-[color:var(--gp-neon)]">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">
                {f.title}
              </h3>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {f.desc}
              </p>
            </div>
          )
        })}
      </div>
    </section>
  )
}
