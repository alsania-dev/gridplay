import { PlusCircle, MousePointerClick, Shuffle, Trophy } from "lucide-react"

const STEPS = [
  {
    icon: PlusCircle,
    step: "01",
    title: "Create or Join",
    desc: "Pick a sport and game, choose your board type, and set the square price.",
  },
  {
    icon: MousePointerClick,
    step: "02",
    title: "Buy Squares",
    desc: "Claim your squares on the grid. Each one is instantly marked with your name.",
  },
  {
    icon: Shuffle,
    step: "03",
    title: "Numbers Assigned",
    desc: "Once all squares sell, random 0-9 digits are assigned to rows and columns fairly.",
  },
  {
    icon: Trophy,
    step: "04",
    title: "Win & Cash Out",
    desc: "Match the last digit of each team's score at the end of each quarter to win.",
  },
]

export function HowItWorks() {
  return (
    <section className="mx-auto w-full max-w-4xl px-4 py-16">
      <h2 className="mb-10 text-center font-[family-name:var(--font-space-grotesk)] text-2xl font-bold tracking-tight md:text-3xl">
        How It Works
      </h2>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((s) => {
          const Icon = s.icon
          return (
            <div
              key={s.step}
              className="relative flex flex-col gap-4 rounded-xl border border-border bg-card p-5"
            >
              <span className="absolute right-4 top-4 font-[family-name:var(--font-space-grotesk)] text-3xl font-bold text-border">
                {s.step}
              </span>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--gp-neon)]/10 text-[color:var(--gp-neon)]">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="mb-1 text-sm font-semibold text-foreground">
                  {s.title}
                </h3>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {s.desc}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
