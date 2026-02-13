import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Hero } from "@/components/hero"
import { HowItWorks } from "@/components/how-it-works"
import { BoardSetup } from "@/components/board-setup"

export default function HomePage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main className="flex-1">
        <Hero />

        <HowItWorks />

        {/* Board creation section */}
        <section className="mx-auto w-full max-w-6xl px-4 py-16">
          <div className="rounded-2xl border border-border bg-card p-6 md:p-10">
            <h2 className="mb-2 text-center font-[family-name:var(--font-space-grotesk)] text-2xl font-bold tracking-tight md:text-3xl">
              Launch Your Board
            </h2>
            <p className="mb-8 text-center text-sm text-muted-foreground">
              Set up a game in seconds. Pick your sport, teams, and board type.
            </p>
            <BoardSetup />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
