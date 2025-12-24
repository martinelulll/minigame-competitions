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

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);

    const { error } = await supabase.auth.signUp({ email, password });

    setLoading(false);

    if (error) {
      setMsg("❌ " + error.message);
      return;
    }

    setMsg("✅ Cont creat! Mergem la login...");
    router.push("/login");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 p-6">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-6 shadow-2xl">
        <h1 className="text-2xl font-semibold text-white">Register</h1>
        <p className="text-sm text-zinc-300 mt-1">Creează cont pentru MiniGame Competitions.</p>

        <form onSubmit={handleRegister} className="mt-6 space-y-4">
          <div>
            <label className="text-sm text-zinc-200">Email</label>
            <input
              className="mt-1 w-full rounded-xl bg-black/30 border border-white/10 px-4 py-3 text-white outline-none focus:border-white/30"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ex: ionel@gmail.com"
              required
            />
          </div>

          <div>
            <label className="text-sm text-zinc-200">Parolă</label>
            <input
              className="mt-1 w-full rounded-xl bg-black/30 border border-white/10 px-4 py-3 text-white outline-none focus:border-white/30"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="minim 6 caractere"
              minLength={6}
              required
            />
          </div>

          {msg && (
            <div className="rounded-xl border border-white/10 bg-black/30 p-3 text-sm text-zinc-100">
              {msg}
            </div>
          )}

          <button
            disabled={loading}
            className="w-full rounded-xl bg-white text-black py-3 font-medium hover:bg-zinc-200 transition disabled:opacity-60"
            type="submit"
          >
            {loading ? "Se creează..." : "Create account"}
          </button>

          <div className="text-sm text-zinc-300 text-center">
            Ai deja cont?{" "}
            <Link className="text-white underline" href="/login">
              Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

