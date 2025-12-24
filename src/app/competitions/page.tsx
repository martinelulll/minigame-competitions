"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function CompetitionsPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push("/login");
      else setEmail(data.user.email ?? null);
    });
  }, [router]);

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">🏆 Competiții</h1>
          <button
            onClick={() => router.push("/dashboard")}
            className="px-3 py-2 rounded border border-white/20 hover:bg-white/10"
          >
            Înapoi
          </button>
        </div>

        <p className="text-white/60">Logat ca: {email ?? "—"}</p>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="rounded-xl border border-white/10 p-4 bg-white/5">
            <div className="text-lg font-semibold">Zilnic</div>
            <div className="text-white/60 text-sm">Intră în daily challenge</div>
            <button className="mt-3 w-full px-3 py-2 rounded bg-white text-black font-semibold">
              Intră
            </button>
          </div>

          <div className="rounded-xl border border-white/10 p-4 bg-white/5">
            <div className="text-lg font-semibold">Săptămânal</div>
            <div className="text-white/60 text-sm">Top săptămânal</div>
            <button className="mt-3 w-full px-3 py-2 rounded bg-white text-black font-semibold">
              Intră
            </button>
          </div>

          <div className="rounded-xl border border-white/10 p-4 bg-white/5">
            <div className="text-lg font-semibold">Lunar</div>
            <div className="text-white/60 text-sm">Clasament lunar</div>
            <button className="mt-3 w-full px-3 py-2 rounded bg-white text-black font-semibold">
              Intră
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
