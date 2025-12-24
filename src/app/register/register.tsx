"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  async function submit() {
    setMsg("");
    if (!email || !password) return setMsg("Completează email și parolă.");

    const { error } = await supabase.auth.signUp({ email, password });
    if (error) return setMsg(error.message);

    setMsg("Cont creat! Acum mergi la Login.");
    // opțional: te duce automat la login
    router.push("/login");
  }

  return (
    <div style={{ maxWidth: 400, margin: "60px auto", display: "grid", gap: 10 }}>
      <h1>Register</h1>

      <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input type="password" placeholder="Parolă" value={password} onChange={(e) => setPassword(e.target.value)} />

      <button onClick={submit}>Create account</button>

      <Link href="/login">Ai deja cont? Login</Link>

      {msg && <p>{msg}</p>}
    </div>
  );
}
