"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"

export default function DashboardPage() {
  const router = useRouter()
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.push("/login")
      } else {
setEmail(data.user?.email ?? null)
      }
    })
  }, [router])

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-6">
      <h1 className="text-3xl font-bold">🎮 MiniGame Competitions</h1>

      <p className="text-gray-400">
        Logat ca: <span className="text-white">{email}</span>
      </p>

      <div className="flex gap-4">
        <button
          onClick={() => router.push("/competitions")}
          className="px-4 py-2 rounded bg-white text-black"
        >
          Competiții
        </button>

        <button
          onClick={() => router.push("/profile")}
          className="px-4 py-2 rounded border border-white"
        >
          Profil
        </button>
      </div>

      <button
        onClick={async () => {
          await supabase.auth.signOut()
          router.push("/login")
        }}
        className="text-sm text-red-400 mt-6"
      >
        Logout
      </button>
    </div>
  )
}
