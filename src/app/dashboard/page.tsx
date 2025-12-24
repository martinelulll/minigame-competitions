"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type ProfileRow = {
  id: string;
  email: string | null;
  points: number | null;
  created_at: string;
};

export default function DashboardPage() {
  const router = useRouter();

  const [email, setEmail] = useState<string | null>(null);
  const [points, setPoints] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setErrorMsg(null);

      // 1) user logat?
      const { data: authData, error: authErr } = await supabase.auth.getUser();
      if (authErr) {
        setErrorMsg(authErr.message);
        setLoading(false);
        return;
      }

      const user = authData.user;
      if (!user) {
        router.push("/login");
        return;
      }

      setEmail(user.email ?? null);

      // 2) citim profilul din DB (points)
      const { data: profile, error: profErr } = await supabase
        .from("profiles")
        .select("id,email,points,created_at")
        .eq("id", user.id)
        .single<ProfileRow>();

      if (profErr) {
        // daca nu exista profil (sau e blocat de RLS), aratam eroare clara
        setErrorMsg(profErr.message);
        setPoints(0);
      } else {
        setPoints(profile?.points ?? 0);
      }

      setLoading(false);
    };

    load();
  }, [router]);

  const onLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="w-full max-w-3xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            🎮 MiniGame Competitions
          </h1>
          <p className="text-gray-400 mt-1">
            Bine ai venit{email ? `, ${email}` : ""}.
          </p>
        </div>

        {loading ? (
          <div className="text-gray-300">Se încarcă...</div>
        ) : (
          <>
            {errorMsg && (
              <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">
                <b>Eroare:</b> {errorMsg}
                <div className="text-red-200/80 mt-1">
                  (Dacă vezi ceva gen “permission denied” → e RLS, vezi pasul 2 mai jos)
                </div>
              </div>
            )}

            {/* Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <div className="text-gray-400 text-sm">Punctele tale</div>
                <div className="text-4xl font-extrabold mt-2">{points}</div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <div className="text-gray-400 text-sm">Competiții active</div>
                <div className="text-2xl font-bold mt-2">0</div>
                <div className="text-gray-500 text-sm mt-1">
                  (urmează să le implementăm)
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <div className="text-gray-400 text-sm">Poziție clasament</div>
                <div className="text-2xl font-bold mt-2">—</div>
                <div className="text-gray-500 text-sm mt-1">
                  (urmează leaderboard)
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3 mt-6">
              <button
                onClick={() => router.push("/competitions")}
                className="px-4 py-2 rounded-lg bg-white text-black font-semibold"
              >
                Competiții
              </button>

              <button
                onClick={() => router.push("/profile")}
                className="px-4 py-2 rounded-lg border border-white/20 hover:bg-white/10"
              >
                Profil
              </button>

              <button
                onClick={onLogout}
                className="px-4 py-2 rounded-lg text-red-300 border border-red-500/30 hover:bg-red-500/10"
              >
                Logout
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
