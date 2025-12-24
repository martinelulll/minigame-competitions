"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function ProfilePage() {
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
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">👤 Profil</h1>
          <button
            onClick={() => router.push("/dashboard")}
            className="px-3 py-2 rounded border border-white/20 hover:bg-white/10"
          >
            Înapoi
          </button>
        </div>

        <div className="rounded-xl border border-white/10 p-5 bg-white/5 space-y-2">
          <div className="text-white/60 text-sm">Email</div>
          <div className="text-lg font-semibold">{email ?? "—"}</div>
        </div>

        <div className="rounded-xl border border-white/10 p-5 bg-white/5">
          <div className="text-white/60 text-sm">Puncte (placeholder)</div>
          <div className="text-2xl font-bold mt-1">0</div>
        </div>
      </div>
    </div>
  );
}
