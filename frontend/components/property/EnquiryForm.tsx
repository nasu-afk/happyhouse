"use client";

import { useState } from "react";
import { api } from "@/lib/api";

export function EnquiryForm({ propertyId }: { propertyId?: number }) {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    setErrorMessage("");

    const form = new FormData(e.currentTarget);
    try {
      await api.enquiries.submit({
        property_id: propertyId,
        name: String(form.get("name")),
        phone: String(form.get("phone")),
        email: form.get("email") ? String(form.get("email")) : undefined,
        message: form.get("message") ? String(form.get("message")) : undefined,
        enquiry_type: propertyId ? "property" : "general",
      });
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  }

  if (status === "success") {
    return (
      <div id="enquire" className="border border-lake rounded-card p-4 text-sm text-lake-dark">
        Thanks — your enquiry has been sent. We&apos;ll get back to you shortly.
      </div>
    );
  }

  return (
    <form id="enquire" onSubmit={handleSubmit} className="space-y-3">
      <input
        name="name" required placeholder="Your name"
        className="w-full border border-line rounded-card px-3 py-2 bg-paper text-sm"
      />
      <input
        name="phone" required placeholder="Phone number" type="tel"
        className="w-full border border-line rounded-card px-3 py-2 bg-paper text-sm"
      />
      <input
        name="email" placeholder="Email (optional)" type="email"
        className="w-full border border-line rounded-card px-3 py-2 bg-paper text-sm"
      />
      <textarea
        name="message" placeholder="Message (optional)" rows={3}
        className="w-full border border-line rounded-card px-3 py-2 bg-paper text-sm"
      />
      {status === "error" && <p className="text-sm text-red-700">{errorMessage}</p>}
      <button
        type="submit"
        disabled={status === "submitting"}
        className="w-full bg-lake text-paper rounded-card py-3 font-medium hover:bg-lake-dark transition-colors disabled:opacity-60"
      >
        {status === "submitting" ? "Sending…" : "Send enquiry"}
      </button>
    </form>
  );
}
