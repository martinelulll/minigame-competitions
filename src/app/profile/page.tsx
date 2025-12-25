"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type ProfileRow = {
  id: string;
  email: string | null;
  points: number | null;
  created_at: string | null;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export default function ProfilePage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState<string>("");
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [error, setError] = useState<string>("");

  // “nivel” simplu: la fiecare 250p crești un nivel
  const points = profile?.points ?? 0;
  const level = useMemo(() => Math.floor(points / 250) + 1, [points]);
  const nextLevelAt = useMemo(() => level * 250, [level]);
  const prevLevelAt = useMemo(() => (level - 1) * 250, [level]);
  const progress = useMemo(() => {
    const span = nextLevelAt - prevLevelAt || 1;
    const pct = ((points - prevLevelAt) / span) * 100;
    return clamp(pct, 0, 100);
  }, [points, prevLevelAt, nextLevelAt]);

  const badges = useMemo(() => {
    // simple “achievements”
    const list = [
      { title: "Primii pași", desc: "Ai creat contul", ok: true },
      { title: "100 Puncte", desc: "Strânge 100 puncte", ok: points >= 100 },
      { title: "Nivel 3", desc: "Ajungi la nivel 3", ok: level >= 3 },
      { title: "Nivel 5", desc: "Ajungi la nivel 5", ok: level >= 5 },
    ];
    return list;
  }, [points, level]);

  async function load() {
    setLoading(true);
    setError("");

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr) {
      setError(userErr.message);
      setLoading(false);
      return;
    }

    const user = userData.user;
    if (!user) {
      router.push("/login");
      return;
    }

    const userEmail = user.email ?? "";
    setEmail(userEmail);

    // încercăm să citim profilul
    const { data: existing, error: profErr } = await supabase
      .from("profiles")
      .select("id,email,points,created_at")
      .eq("id", user.id)
      .maybeSingle();

    if (profErr) {
      setError(profErr.message);
      setLoading(false);
      return;
    }

    // dacă nu există, îl creăm
    if (!existing) {
      const { data: created, error: createErr } = await supabase
        .from("profiles")
        .insert([
          {
            id: user.id,
            email: userEmail,
            points: 0,
          },
        ])
        .select("id,email,points,created_at")
        .single();

      if (createErr) {
        setError(createErr.message);
        setLoading(false);
        return;
      }

      setProfile(created);
      setLoading(false);
      return;
    }

    // dacă există dar email null, îl completăm
    if (!existing.email && userEmail) {
      await supabase.from("profiles").update({ email: userEmail }).eq("id", user.id);
    }

    setProfile(existing);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  async function addTestPoints() {
    setError("");
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user || !profile) return;

    const newPoints = (profile.points ?? 0) + 10;

    const { data, error: upErr } = await supabase
      .from("profiles")
      .update({ points: newPoints })
      .eq("id", user.id)
      .select("id,email,points,created_at")
      .single();

    if (upErr) {
      setError(upErr.message);
      return;
    }
    setProfile(data);
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Profil</h1>
          <p className="text-sm text-white/60">
            Datele tale + progresul în competiții.
          </p>
        </div>

        <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg">
          {loading ? (
            <div className="text-white/70">Se încarcă profilul…</div>
          ) : error ? (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
              {error}
            </div>
          ) : (
            <>
              {/* Header card */}
              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                  <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white/10 text-xl">
                    🎮
                  </div>
                  <div>
                    <div className="text-lg font-semibold">Bine ai venit!</div>
                    <div className="text-sm text-white/60">{email}</div>
                    <div className="mt-1 text-xs text-white/40">
                      ID: {profile?.id}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => router.push("/dashboard")}
                    className="rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm hover:bg-white/15"
                  >
                    ← Dashboard
                  </button>

                  <button
                    onClick={() => router.push("/competitions")}
                    className="rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm hover:bg-white/15"
                  >
                    Competiții
                  </button>

                  <button
                    onClick={logout}
                    className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-200 hover:bg-red-500/15"
                  >
                    Logout
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div className="mt-8 grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
                  <div className="text-xs text-white/50">Punctele tale</div>
                  <div className="mt-2 text-3xl font-bold">{points}</div>
                  <div className="mt-2 text-xs text-white/40">
                    Se actualizează din tabela <span className="text-white/60">profiles</span>.
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
                  <div className="text-xs text-white/50">Nivel</div>
                  <div className="mt-2 text-3xl font-bold">Lv. {level}</div>

                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs text-white/50">
                      <span>{prevLevelAt}p</span>
                      <span>{nextLevelAt}p</span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-white/10">
                      <div
                        className="h-2 rounded-full bg-white"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="mt-2 text-xs text-white/50">
                      Progres: <span className="text-white/80">{Math.round(progress)}%</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
                  <div className="text-xs text-white/50">Status</div>
                  <div className="mt-2 text-sm text-white/80">
                    ✅ Cont activ • 🔒 Autentificat
                  </div>

                  <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-white/60">
                    În curând: poziție în clasament + istoric meciuri.
                  </div>

                  <button
                    onClick={addTestPoints}
                    className="mt-4 w-full rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black hover:opacity-90"
                  >
                    +10 puncte (test)
                  </button>
                </div>
              </div>

              {/* Badges */}
              <div className="mt-8 rounded-2xl border border-white/10 bg-black/30 p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Badges</h2>
                  <span className="text-xs text-white/40">Achievements</span>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {badges.map((b) => (
                    <div
                      key={b.title}
                      className={`rounded-2xl border p-4 ${
                        b.ok
                          ? "border-white/10 bg-white/5"
                          : "border-white/10 bg-black/20 opacity-70"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-semibold">
                          {b.ok ? "🏅" : "🔒"} {b.title}
                        </div>
                        <div className="text-xs text-white/50">
                          {b.ok ? "deblocat" : "blocat"}
                        </div>
                      </div>
                      <div className="mt-1 text-sm text-white/60">{b.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Last games placeholder */}
              <div className="mt-8 rounded-2xl border border-white/10 bg-black/30 p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Ultimele jocuri</h2>
                  <span className="text-xs text-white/40">placeholder</span>
                </div>

                <div className="mt-4 space-y-3">
                  {[
                    { name: "MiniGame Zilnic", result: "—", points: "+0", when: "azi" },
                    { name: "Competiție săptămânală", result: "—", points: "+0", when: "săptămâna asta" },
                  ].map((row, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4"
                    >
                      <div>
                        <div className="font-semibold">{row.name}</div>
                        <div className="text-xs text-white/50">
                          Rezultat: {row.result} • {row.when}
                        </div>
                      </div>
                      <div className="text-sm text-white/70">{row.points}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 text-xs text-white/40">
                  Când facem tabela de “matches”, aici afișăm real.
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
