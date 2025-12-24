"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const onRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // dacă ai confirmare email ON, userul va primi mail
        emailRedirectTo: `${window.location.origin}/login`,
      },
    });

    setLoading(false);

    if (error) {
      setMsg(error.message);
      return;
    }

    setMsg("Cont creat! Verifică emailul (dacă ai confirmare activă) sau mergi la Login.");
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-6 shadow-xl">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-white">Register</h1>
            <p className="text-sm text-zinc-300 mt-1">
              Creează un cont nou rapid.
            </p>
          </div>

          {msg && (
            <div className="mb-4 rounded-xl border border-white/10 bg-white/10 p-3 text-sm text-zinc-100">
              {msg}
            </div>
          )}

          <form onSubmit={onRegister} className="space-y-4">
            <div>
              <label className="text-sm text-zinc-200">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ex: nume@email.com"
                className="mt-1 w-full rounded-xl border border-white/10 bg-zinc-950/40 px-4 py-3 text-white outline-none focus:border-white/25"
                required
              />
            </div>

            <div>
              <label className="text-sm text-zinc-200">Parolă</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="minim 6 caractere"
                className="mt-1 w-full rounded-xl border border-white/10 bg-zinc-950/40 px-4 py-3 text-white outline-none focus:border-white/25"
                minLength={6}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-white text-zinc-950 font-medium py-3 hover:opacity-90 disabled:opacity-60"
            >
              {loading ? "Se creează..." : "Create account"}
            </button>

            <div className="flex items-center justify-between text-sm text-zinc-300">
              <span>Ai deja cont?</span>
              <Link className="text-white hover:underline" href="/login">
                Login →
              </Link>
            </div>
          </form>
        </div>

        <p className="mt-4 text-center text-xs text-zinc-500">
          MiniGame Competitions • Auth (Supabase)
        </p>
      </div>
    </main>
  );
}

