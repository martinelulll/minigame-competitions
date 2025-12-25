"use client";

import { useRouter } from "next/navigation";

export default function CompetitionsPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">🏆 Competiții active</h1>

        <div className="grid gap-4">
          {/* Competitie fake – demo */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-5 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">MiniGame Zilnic</h2>
              <p className="text-gray-400 text-sm">
                Joacă azi și câștigă până la 50 puncte
              </p>
            </div>

            <button
              className="px-4 py-2 rounded-lg bg-white text-black font-semibold"
              onClick={() => alert("Aici va porni jocul 👀")}
            >
              Intră
            </button>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-5 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">Competiție săptămânală</h2>
              <p className="text-gray-400 text-sm">
                Top jucători – puncte bonus
              </p>
            </div>

            <button className="px-4 py-2 rounded-lg border border-white/20">
              În curând
            </button>
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={() => router.push("/dashboard")}
            className="text-gray-400 hover:text-white"
          >
            ← Înapoi la dashboard
          </button>
        </div>
      </div>
    </main>
  );
}

