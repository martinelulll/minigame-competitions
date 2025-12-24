"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "register">("login");
  const [msg, setMsg] = useState("");

  async function submit() {
    setMsg("");

    if (!email || !password) {
      setMsg("Completează email și parolă");
      return;
    }

    if (mode === "register") {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) return setMsg(error.message);
      setMsg("Cont creat! Acum fă login.");
      setMode("login");
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return setMsg(error.message);

    router.push("/dashboard");
  }

  return (
    <div style={{ maxWidth: 400, margin: "60px auto", display: "grid", gap: 10 }}>
      <h1>{mode === "login" ? "Login" : "Register"}</h1>

      <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
      <input type="password" placeholder="Parolă" value={password} onChange={e => setPassword(e.target.value)} />

      <button onClick={submit}>
        {mode === "login" ? "Login" : "Create account"}
      </button>

      <button onClick={() => setMode(mode === "login" ? "register" : "login")}>
        {mode === "login" ? "Nu ai cont? Register" : "Ai cont? Login"}
      </button>

      {msg && <p>{msg}</p>}
    </div>
  );
}
