import { ArrowRight, Stethoscope, Trophy, Users } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-4 lg:px-6 h-14 flex items-center border-b">
        <Link className="flex items-center justify-center" href="#">
          <Stethoscope className="h-6 w-6 mr-2" />
          <span className="font-bold">Antics MD</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="#">
            Features
          </Link>
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="#">
            Leaderboard
          </Link>
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="#">
            Login
          </Link>
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 flex flex-col items-center justify-center text-center px-4">
          <div className="space-y-4 max-w-3xl">
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
              Competitive Hospital Operations & Clinical Reasoning
            </h1>
            <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
              Master the ward floor. Compete with others to diagnose and treat patients in a real-time multiplayer simulation.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/play"
                className="inline-flex h-10 items-center justify-center rounded-md bg-black px-8 text-sm font-medium text-white shadow transition-colors hover:bg-black/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:pointer-events-none disabled:opacity-50"
              >
                Enter the Ward
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
        
        <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-100 dark:bg-gray-800 flex justify-center">
          <div className="container px-4 md:px-6">
            <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
              <div className="flex flex-col items-center space-y-4 text-center">
                <div className="bg-white p-3 rounded-full shadow-sm">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold">Multiplayer Chaos</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Real-time player sync using PartyKit. See others on the ward floor and beat them to the charting station.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4 text-center">
                <div className="bg-white p-3 rounded-full shadow-sm">
                  <Stethoscope className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-xl font-bold">Clinical Reasoning</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Evidence-based vignettes generated from Neo4j medical ontologies. Test your diagnostic skills.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4 text-center">
                <div className="bg-white p-3 rounded-full shadow-sm">
                  <Trophy className="h-6 w-6 text-yellow-600" />
                </div>
                <h3 className="text-xl font-bold">Curbside Steal</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Eavesdrop on rival interviews and claim the points before they do. Speed and accuracy win the day.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-gray-500 dark:text-gray-400">© 2026 Antics MD. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            Terms of Service
          </Link>
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  );
}
