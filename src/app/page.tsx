import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black flex items-center justify-center px-4">
      <div className="max-w-3xl w-full text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
          🎮 MiniGame Competitions
        </h1>

        <p className="text-zinc-300 text-lg mb-10">
          Intră în competiții zilnice, săptămânale și lunare.
          <br />
          Joacă mini-game-uri, câștigă puncte și urcă în top.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/login"
            className="px-8 py-4 rounded-xl bg-white text-zinc-900 font-semibold hover:opacity-90 transition"
          >
            Login
          </Link>

          <Link
            href="/register"
            className="px-8 py-4 rounded-xl border border-white/20 text-white hover:bg-white/10 transition"
          >
            Register
          </Link>
        </div>

        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 text-zinc-300">
          <div className="rounded-xl border border-white/10 p-4">
            🏆 <b>Competiții</b>
            <p className="text-sm mt-1">Zilnice, săptămânale, lunare</p>
          </div>
          <div className="rounded-xl border border-white/10 p-4">
            🎯 <b>Mini-game-uri</b>
            <p className="text-sm mt-1">Rapid, distractiv</p>
          </div>
          <div className="rounded-xl border border-white/10 p-4">
            📊 <b>Clasament</b>
            <p className="text-sm mt-1">Top jucători</p>
          </div>
        </div>
      </div>
    </main>
  );
}
