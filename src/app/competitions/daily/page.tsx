"use client";

import { useRouter } from "next/navigation";

export default function DailyCompetitionPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="w-full max-w-2xl space-y-6">
        <h1 className="text-3xl font-bold">🏆 MiniGame Zilnic</h1>
        <p className="text-white/70">
          Aici va fi jocul / provocarea de azi. (urmează să o implementăm)
        </p>

        <div className="rounded-xl bg-white/5 p-4">
          <p className="text-sm text-white/60">Reward</p>
          <p className="text-xl font-semibold">până la 50 puncte</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => router.push("/dashboard")}
            className="px-4 py-2 rounded bg-white text-black"
          >
            Înapoi la dashboard
          </button>

          <button
            onClick={() => alert("Aici pornim mini-game-ul")}
            className="px-4 py-2 rounded border border-white/30"
          >
            Start (demo)
          </button>
        </div>
      </div>
    </main>
  );
}
