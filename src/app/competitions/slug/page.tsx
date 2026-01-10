"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type LeaderRow = { user_id: string; email: string | null; best_score: number };

export default function CompetitionSlugPage() {
  const router = useRouter();
  const params = useParams<{ slug: string }>();
  const slug = params?.slug;

  useEffect(() => {
    // protecție: dacă nu e logat -> login
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push("/login");
    });
  }, [router]);

  if (!slug) return null;

  if (slug === "daily") {
    return <DailyReflexGame onBack={() => router.push("/competitions")} />;
  }

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="w-full max-w-xl border border-white/10 rounded-2xl p-6 bg-white/5">
        <h1 className="text-2xl font-bold">Competiție: {slug}</h1>
        <p className="text-white/70 mt-2">În curând 🔥</p>
        <button
          onClick={() => router.push("/competitions")}
          className="mt-6 px-4 py-2 rounded bg-white text-black"
        >
          Înapoi la competiții
        </button>
      </div>
    </main>
  );
}

function DailyReflexGame({ onBack }: { onBack: () => void }) {
  const router = useRouter();

  const DURATION_MS = 30_000;
  const MOVE_EVERY_MS = 650;

  const [email, setEmail] = useState<string | null>(null);

  const [running, setRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(DURATION_MS);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);

  const [submittedBest, setSubmittedBest] = useState<number | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderRow[]>([]);
  const [loadingLb, setLoadingLb] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const arenaRef = useRef<HTMLDivElement | null>(null);
  const [target, setTarget] = useState({ x: 40, y: 40, r: 22 });

  const accuracy = useMemo(() => {
    const total = hits + misses;
    if (total === 0) return 1;
    return hits / total;
  }, [hits, misses]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
      if (!data.user) router.push("/login");
    });
  }, [router]);

  // mișcă ținta random în arena
  const moveTarget = () => {
    const el = arenaRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const r = 22;

    const maxX = Math.max(r, rect.width - r);
    const maxY = Math.max(r, rect.height - r);

    const x = Math.floor(r + Math.random() * (maxX - r));
    const y = Math.floor(r + Math.random() * (maxY - r));

    setTarget({ x, y, r });
  };

  useEffect(() => {
    if (!running) return;

    setErr(null);
    moveTarget();

    const t0 = Date.now();
    const tick = setInterval(() => {
      const elapsed = Date.now() - t0;
      const left = Math.max(0, DURATION_MS - elapsed);
      setTimeLeft(left);
      if (left === 0) setRunning(false);
    }, 100);

    const mover = setInterval(() => {
      moveTarget();
    }, MOVE_EVERY_MS);

    return () => {
      clearInterval(tick);
      clearInterval(mover);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  const resetRun = () => {
    setRunning(false);
    setTimeLeft(DURATION_MS);
    setScore(0);
    setStreak(0);
    setHits(0);
    setMisses(0);
    setSubmittedBest(null);
    setErr(null);
  };

  const start = () => {
    resetRun();
    setRunning(true);
  };

  const onHit = () => {
    if (!running) return;
    const nextStreak = streak + 1;
    setStreak(nextStreak);
    setHits((v) => v + 1);

    // punctaj: bază + bonus streak
    const add = 10 + Math.min(20, nextStreak * 2);
    setScore((s) => s + add);

    moveTarget();
  };

  const onMiss = () => {
    if (!running) return;
    setMisses((v) => v + 1);
    setStreak(0);
    setScore((s) => Math.max(0, s - 5));
  };

  const finalScore = useMemo(() => {
    // bonus accuracy (max +25%)
    const bonus = 1 + Math.min(0.25, (accuracy - 0.5) * 0.5); // dacă ai peste 50% accuracy, crește ușor
    return Math.floor(score * bonus);
  }, [score, accuracy]);

  const loadLeaderboard = async () => {
    setLoadingLb(true);
    const { data, error } = await supabase
      .from("daily_leaderboard")
      .select("user_id,email,best_score")
      .order("best_score", { ascending: false })
      .limit(20);

    setLoadingLb(false);
    if (error) {
      setErr(error.message);
      return;
    }
    setLeaderboard((data as any) ?? []);
  };

  const submitScore = async () => {
    setErr(null);
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      router.push("/login");
      return;
    }

    // trimite scorul prin funcție (DB decide best + update profiles.points)
    const { data, error } = await supabase.rpc("submit_daily_score", {
      p_score: finalScore,
    });

    if (error) {
      setErr(error.message);
      return;
    }

    setSubmittedBest(typeof data === "number" ? data : finalScore);
    await loadLeaderboard();
  };

  useEffect(() => {
    loadLeaderboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">🏆 MiniGame Zilnic</h1>
            <p className="text-white/70 mt-1">
              Reflex Click Arena — 30 secunde • Logat ca:{" "}
              <span className="text-white">{email ?? "..."}</span>
            </p>
          </div>

          <div className="flex gap-2">
            <button onClick={onBack} className="px-4 py-2 rounded border border-white/30">
              Înapoi
            </button>
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                router.push("/login");
              }}
              className="px-4 py-2 rounded border border-red-500/60 text-red-300"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 border border-white/10 rounded-2xl bg-white/5 p-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex gap-4">
                <Stat label="Timp" value={`${Math.ceil(timeLeft / 1000)}s`} />
                <Stat label="Scor" value={`${score}`} />
                <Stat label="Streak" value={`${streak}`} />
                <Stat label="Accuracy" value={`${Math.round(accuracy * 100)}%`} />
              </div>

              <div className="flex gap-2">
                {!running ? (
                  <button onClick={start} className="px-4 py-2 rounded bg-white text-black">
                    Start
                  </button>
                ) : (
                  <button onClick={() => setRunning(false)} className="px-4 py-2 rounded border border-white/30">
                    Stop
                  </button>
                )}
                <button onClick={resetRun} className="px-4 py-2 rounded border border-white/30">
                  Reset
                </button>
              </div>
            </div>

            <div
              ref={arenaRef}
              onClick={onMiss}
              className="mt-4 relative w-full h-[420px] rounded-xl border border-white/10 bg-black overflow-hidden select-none"
            >
              {/* target */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onHit();
                }}
                aria-label="target"
                className="absolute rounded-full border border-white/80 bg-white/20 hover:bg-white/30 active:scale-95 transition"
                style={{
                  width: target.r * 2,
                  height: target.r * 2,
                  left: target.x - target.r,
                  top: target.y - target.r,
                }}
              />
              {!running && timeLeft === 0 && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                  <div className="text-center">
                    <div className="text-2xl font-bold">Runda terminată!</div>
                    <div className="text-white/70 mt-2">
                      Scor final: <span className="text-white">{finalScore}</span>
                    </div>
                    <button
                      onClick={submitScore}
                      className="mt-4 px-4 py-2 rounded bg-white text-black"
                    >
                      Trimite scorul
                    </button>
                    {submittedBest !== null && (
                      <div className="mt-3 text-white/80">
                        Best-ul tău (daily): <span className="text-white">{submittedBest}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <p className="text-white/60 mt-3 text-sm">
              Tip: încearcă să nu dai click pe fundal (ratezi și pierzi streak). Ținta se mută periodic.
            </p>

            {err && (
              <div className="mt-3 p-3 rounded border border-red-500/40 text-red-200 bg-red-500/10">
                {err}
              </div>
            )}
          </div>

          <div className="border border-white/10 rounded-2xl bg-white/5 p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">🏅 Leaderboard</h2>
              <button
                onClick={loadLeaderboard}
                className="px-3 py-1 rounded border border-white/30 text-sm"
              >
                Refresh
              </button>
            </div>

            {loadingLb ? (
              <p className="text-white/60 mt-3">Se încarcă…</p>
            ) : (
              <ol className="mt-3 space-y-2">
                {leaderboard.map((row, idx) => (
                  <li
                    key={row.user_id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/30 px-3 py-2"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-6 text-white/60">{idx + 1}</span>
                      <span className="truncate text-white/80">
                        {row.email ?? row.user_id}
                      </span>
                    </div>
                    <span className="font-bold">{row.best_score}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-3 py-2 rounded-lg border border-white/10 bg-black/30">
      <div className="text-xs text-white/60">{label}</div>
      <div className="text-lg font-bold">{value}</div>
    </div>
  );
}
