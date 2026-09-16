"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { api } from "@/lib/api";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api.auth.login(email, password);
      router.push("/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-night px-6">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-paper border border-line rounded-card p-8">
        <Image src="/logo.png" alt="HappyHouse" width={140} height={91} className="h-16 w-auto mx-auto mb-4" priority />
        <h1 className="font-display text-xl text-ink text-center mb-1">Admin</h1>
        <p className="text-stone text-sm text-center mb-6">Sign in to manage properties and enquiries.</p>

        <label className="block mb-4">
          <span className="text-sm text-stone">Email</span>
          <input
            type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full border border-line rounded-card px-3 py-2"
          />
        </label>

        <label className="block mb-6">
          <span className="text-sm text-stone">Password</span>
          <input
            type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full border border-line rounded-card px-3 py-2"
          />
        </label>

        {error && <p className="text-sm text-red-700 mb-4">{error}</p>}

        <button
          type="submit" disabled={loading}
          className="w-full bg-ink text-paper rounded-card py-3 font-medium hover:bg-lake-dark transition-colors disabled:opacity-60"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </main>
  );
}
