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
    <div className="mx-auto flex min-h-[70vh] w-full max-w-sm flex-col justify-center px-8">
      <p className="label text-[15px] text-brass-text">Empowered Ink</p>
      <h1 className="mb-6 mt-1 font-display text-[30px]">Admin</h1>
      <form onSubmit={handleSubmit}>
        <label htmlFor="admin-password" className="label mb-1 block text-[14px] text-soft">
          Password
        </label>
        <input
          id="admin-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-3 w-full border border-hairline bg-white px-3.5 py-2.5 text-[14px] focus:border-ink focus:outline-none"
          autoFocus
        />
        {error && <p role="alert" className="mb-3 text-[12.5px] text-red-700">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-plum px-6 py-3 text-[14px] text-ivory hover:bg-brass-text disabled:opacity-60"
        >
          {loading ? "Checking…" : "Sign In"}
        </button>
      </form>
    </div>
  );
}
