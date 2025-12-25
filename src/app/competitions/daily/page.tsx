"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type LeaderRow = {
  score: number;
  profiles?: { email: string | null } | null;
};

const KEYS = [
  { k: "ArrowUp", label: "⬆️", alt: "W" },
  { k: "ArrowDown", label: "⬇️", alt: "S" },
  { k: "ArrowLeft", label: "⬅️", alt: "A" },
  { k: "ArrowRight", label: "➡️", alt: "D" },
] as const;

function randomTarget() {
  return KEYS[Math.floor(Math.random() * KEYS.length)];
}

export default function DailyCompetitionPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);

  const [competitionId, setCompetitionId] = useState<number | null>(null);
  const [bestSaved, setBestSaved] = useState<number | null>(null);

  const [timeLeft, setTimeLeft] = useState(60);
  const [running, setRunning] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [lastHit, setLastHit] = useState<"ok" | "bad" | null>(null);

  const [target, setTarget] = useState(() => randomTarget());
  const [leaderboard, setLeaderboard] = useState<LeaderRow[]>([]);
  const tickRef = useRef<number | null>(null);

  // simple anti-spam: nu lăsăm submit la fiecare click
  const submitLock = useRef(false);

  const dayStr = useMemo(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        router.push("/login");
        return;
      }
      setEmail(auth.user.email ?? null);

      // get/create today's competition (DB function)
      const { data: comp, error: compErr } = await supabase
        .rpc("get_or_create_daily_competition", { _day: dayStr })
        .single();

      if (compErr) {
        console.error(compErr);
        alert("Eroare la competiție. Verifică Supabase RPC.");
        setLoading(false);
        return;
      }

      setCompetitionId(comp.id);

      // fetch your current best
      const { data: myMatch } = await supabase
        .from("matches")
        .select("score")
        .eq("competition_id", comp.id)
        .eq("user_id", auth.user.id)
        .maybeSingle();

      setBestSaved(myMatch?.score ?? null);

      await refreshLeaderboard(comp.id);

      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, dayStr]);

  async function refreshLeaderboard(compId: number) {
    // top 10 best scores for this competition
    const { data, error } = await supabase
      .from("matches")
      .select("score, profiles(email)")
      .eq("competition_id", compId)
      .order("score", { ascending: false })
      .limit(10);

    if (error) {
      console.error(error);
      return;
    }
    setLeaderboard((data as any) ?? []);
  }

  function startGame() {
    setScore(0);
    setStreak(0);
    setLastHit(null);
    setTarget(randomTarget());
    setTimeLeft(60);
    setRunning(true);

    if (tickRef.current) window.clearInterval(tickRef.current);
    tickRef.current = window.setInterval(() => {
      setTimeLeft((t) => t - 1);
    }, 1000);
  }

  async function stopGameAndSubmit(finalScore: number) {
    setRunning(false);
    if (tickRef.current) window.clearInterval(tickRef.current);

    if (!competitionId) return;

    // submit best (atomic) – only once
    if (submitLock.current) return;
    submitLock.current = true;

    const { data, error } = await supabase.rpc("submit_daily_score", {
      _competition_id: competitionId,
      _score: finalScore,
    });

    submitLock.current = false;

    if (error) {
      console.error(error);
      alert("Nu am putut salva scorul. Verifică RPC submit_daily_score.");
      return;
    }

    setBestSaved(data as number);
    await refreshLeaderboard(competitionId);
  }

  useEffect(() => {
    if (!running) return;

    if (timeLeft <= 0) {
      // game ended
      void stopGameAndSubmit(score);
      return;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, running]);

  function handleAnswer(key: (typeof KEYS)[number]["k"]) {
    if (!running) return;

    if (key === target.k) {
      const newStreak = streak + 1;
      const bonus = Math.min(20, Math.floor(newStreak / 5) * 5); // bonus la fiecare 5 streak
      const gained = 10 + bonus;

      setStreak(newStreak);
      setScore((s) => s + gained);
      setLastHit("ok");
      setTarget(randomTarget());
    } else {
      setStreak(0);
      setScore((s) => Math.max(0, s - 5)); // mică penalizare
      setLastHit("bad");
    }
  }

  // Keyboard controls
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const k = e.key;
      if (k === "w" || k === "W") return handleAnswer("ArrowUp");
      if (k === "s" || k === "S") return handleAnswer("ArrowDown");
      if (k === "a" || k === "A") return handleAnswer("ArrowLeft");
      if (k === "d" || k === "D") return handleAnswer("ArrowRight");

      if (k === "ArrowUp" || k === "ArrowDown" || k === "ArrowLeft" || k === "ArrowRight") {
        e.preventDefault();
        handleAnswer(k);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, target, streak]);

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        Se încarcă...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white p-6 flex items-center justify-center">
      <div className="w-full max-w-3xl space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">⚡ QuickTap 60s</h1>
            <p className="text-white/70">
              Apasă direcția corectă (săgeți / WASD / butoane). Fă streak mare pentru bonus.
            </p>
            <p className="text-white/50 text-sm mt-1">Logat: {email ?? "—"} · Zi: {dayStr}</p>
          </div>

          <button
            onClick={() => router.push("/competitions")}
            className="px-3 py-2 rounded border border-white/20 hover:border-white/40"
          >
            ← Înapoi
          </button>
        </div>

        {/* HUD */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-xl bg-white/5 p-4 border border-white/10">
            <p className="text-sm text-white/60">Timp</p>
            <p className="text-2xl font-semibold">{running ? timeLeft : 60}s</p>
          </div>
          <div className="rounded-xl bg-white/5 p-4 border border-white/10">
            <p className="text-sm text-white/60">Scor</p>
            <p className="text-2xl font-semibold">{score}</p>
          </div>
          <div className="rounded-xl bg-white/5 p-4 border border-white/10">
            <p className="text-sm text-white/60">Streak</p>
            <p className="text-2xl font-semibold">{streak}</p>
          </div>
        </div>

        {/* Target */}
        <div
          className={[
            "rounded-2xl p-6 border text-center bg-white/5",
            lastHit === "ok" ? "border-green-500/40" : lastHit === "bad" ? "border-red-500/40" : "border-white/10",
          ].join(" ")}
        >
          <p className="text-white/60 text-sm">Țintă</p>
          <div className="text-6xl font-bold mt-2">{target.label}</div>
          <p className="text-white/50 text-sm mt-2">
            Taste: <span className="text-white/80">{target.k}</span> sau <span className="text-white/80">{target.alt}</span>
          </p>

          <div className="mt-5 flex flex-wrap gap-3 justify-center">
            {!running ? (
              <button
                onClick={startGame}
                className="px-5 py-2 rounded bg-white text-black font-medium"
              >
                Start
              </button>
            ) : (
              <button
                onClick={() => void stopGameAndSubmit(score)}
                className="px-5 py-2 rounded border border-white/30"
              >
                Oprește & Salvează
              </button>
            )}

            <button
              onClick={() => router.push("/dashboard")}
              className="px-5 py-2 rounded border border-white/20 hover:border-white/40"
            >
              Dashboard
            </button>
          </div>
        </div>

        {/* Mobile buttons */}
        <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
          <p className="text-white/60 text-sm mb-3">Controale (telefon / mouse)</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {KEYS.map((x) => (
              <button
                key={x.k}
                onClick={() => handleAnswer(x.k)}
                className="py-3 rounded-xl border border-white/20 hover:border-white/40 text-xl"
              >
                {x.label}
                <div className="text-xs text-white/50 mt-1">{x.alt}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Saved + leaderboard */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
            <h2 className="text-lg font-semibold">📌 Best-ul tău azi</h2>
            <p className="text-3xl font-bold mt-2">{bestSaved ?? 0}</p>
            <p className="text-white/60 text-sm mt-1">
              Se salvează automat doar dacă îți depășești scorul.
            </p>
          </div>

          <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">🏅 Top 10 azi</h2>
              <button
                onClick={() => competitionId && refreshLeaderboard(competitionId)}
                className="text-sm px-3 py-1 rounded border border-white/20 hover:border-white/40"
              >
                Refresh
              </button>
            </div>

            <div className="mt-3 space-y-2">
              {leaderboard.length === 0 ? (
                <p className="text-white/60 text-sm">Încă nu există scoruri.</p>
              ) : (
                leaderboard.map((row, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-xl bg-black/30 border border-white/10 px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-6 text-white/70">#{idx + 1}</span>
                      <span className="text-white/80 text-sm">
                        {row.profiles?.email ?? "user"}
                      </span>
                    </div>
                    <span className="font-semibold">{row.score}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <p className="text-white/40 text-xs">
          Tip: pe PC e cel mai rapid cu săgeți/WASD.
        </p>
      </div>
    </main>
  );
}
