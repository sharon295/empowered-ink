"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      router.refresh();
    } else {
      setError("Incorrect password.");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center px-8">
      <h1 className="mb-6 font-display text-[26px] font-medium text-midnight-plum">Admin Review</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="password"
          placeholder="Admin password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-3 w-full rounded-sm border border-deep-plum/25 bg-white px-3.5 py-2.5 text-[14px]"
          autoFocus
        />
        {error && <p className="mb-3 text-[12.5px] text-red-700">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-sm bg-deep-plum px-6 py-3 text-[13px] font-bold uppercase tracking-wider text-warm-white disabled:opacity-60"
        >
          {loading ? "Checking…" : "Sign In"}
        </button>
      </form>
    </div>
  );
}
