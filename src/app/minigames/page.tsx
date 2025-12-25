"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function MiniGamePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // (opțional) verifică dacă ești logat
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push("/login");
    });
  }, [router]);

  async function finishGame() {
    setLoading(true);
    setMsg(null);

    // demo: “score” random + points random
    const score = Math.floor(Math.random() * 100);
    const points = Math.max(5, Math.floor(score / 2)); // ex: 5..50

    // IMPORTANT: pune aici ID-ul competiției “MiniGame Zilnic”
    // Cel mai simplu: intră în Supabase Table Editor -> competitions -> vezi id-ul rândului.
    const competitionId = 1; // <- schimbă dacă nu e 1

    const { error } = await supabase.rpc("submit_match", {
      p_competition_id: competitionId,
      p_score: score,
      p_points_earned: points,
      p_game: "minigame_daily",
    });

    if (error) {
      setMsg(error.message);
      setLoading(false);
      return;
    }

    setMsg(`✅ Ai terminat! Score: ${score}, +${points} puncte`);
    setLoading(false);

    // trimite înapoi la dashboard ca să vezi points actualizat
    setTimeout(() => router.push("/dashboard"), 800);
  }

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-6">
        <h1 className="text-2xl font-bold mb-2">MiniGame Zilnic</h1>
        <p className="text-white/70 mb-6">
          Demo acum: apăsă “Finalizează” și îți adaugă puncte + salvează match.
        </p>

        {msg && (
          <div className="mb-4 rounded-xl border border-white/10 bg-black/40 p-3 text-sm">
            {msg}
          </div>
        )}

        <button
          onClick={finishGame}
          disabled={loading}
          className="w-full rounded-xl bg-white text-black py-3 font-semibold disabled:opacity-60"
        >
          {loading ? "Se salvează..." : "Finalizează (demo)"}
        </button>

        <button
          onClick={() => router.push("/competitions")}
          className="w-full mt-3 rounded-xl border border-white/20 py-3"
        >
          Înapoi la Competiții
        </button>
      </div>
    </main>
  );
}
