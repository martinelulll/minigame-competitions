"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Competition = {
  id: number;
  title: string;
  description: string | null;
  reward_points: number;
  is_active: boolean;
};

export default function CompetitionsPage() {
  const router = useRouter();
  const [items, setItems] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setErr(null);

      const { data, error } = await supabase
        .from("competitions")
        .select("id,title,description,reward_points,is_active")
        .order("id", { ascending: true });

      if (error) setErr(error.message);
      setItems(data ?? []);
      setLoading(false);
    };

    load();
  }, []);

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">🏆 Competiții active</h1>

        {loading && <p className="text-gray-400">Se încarcă...</p>}

        {err && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
            Eroare: {err}
          </div>
        )}

        {!loading && !err && (
          <div className="grid gap-4">
            {items.filter((c) => c.is_active).length === 0 ? (
              <p className="text-gray-400">Nu există competiții active.</p>
            ) : (
              items
                .filter((c) => c.is_active)
                .map((c) => (
                  <div
                    key={c.id}
                    className="rounded-xl border border-white/10 bg-white/5 p-5 flex justify-between items-center"
                  >
                    <div>
                      <h2 className="text-xl font-semibold">{c.title}</h2>
                      <p className="text-gray-400 text-sm">
                        {c.description ?? "Fără descriere"}
                      </p>
                      <p className="text-gray-300 text-sm mt-1">
                        Recompensă: <b>{c.reward_points}</b> puncte
                      </p>
                    </div>

                    <button
                      className="px-4 py-2 rounded-lg bg-white text-black font-semibold"
                      onClick={() => alert(`Start competiție: ${c.title}`)}
                    >
                      Intră
                    </button>
                  </div>
                ))
            )}
          </div>
        )}

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


