"use client";

import { useEffect, useRef, useState } from "react";

type Status = "idle" | "sending" | "ok" | "err";
type FieldErrors = { name?: string; email?: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function InquiryForm({ phone }: { phone: string }) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const successRef = useRef<HTMLHeadingElement | null>(null);

  useEffect(() => {
    if (status === "ok") successRef.current?.focus();
  }, [status]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries()) as Record<string, string>;

    // Honeypot: bots fill hidden fields.
    if (data.company) {
      setStatus("ok");
      return;
    }

    // Client-side validation so mistakes surface instantly, at the field.
    const fe: FieldErrors = {};
    if (!data.name?.trim()) fe.name = "Please add your name.";
    if (!EMAIL_RE.test(data.email ?? "")) fe.email = "Please add a valid email.";
    setFieldErrors(fe);
    if (Object.keys(fe).length) {
      setStatus("err");
      setError("Please check the highlighted fields.");
      document.getElementById(fe.name ? "name" : "email")?.focus();
      return;
    }

    setStatus("sending");
    setError("");
    try {
      const res = await fetch("/api/inquire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Something went wrong. Please try again or call us.");
      }
      setStatus("ok");
      form.reset();
    } catch (err) {
      setStatus("err");
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  if (status === "ok") {
    return (
      <div className="form">
        <div className="form__success" role="status">
          <h3 tabIndex={-1} ref={successRef}>Thank you. Your inquiry is in.</h3>
          <p>
            We will come back to you personally, usually within a day, with availability and rates
            for your dates. If it is time sensitive, call or text{" "}
            <a href={`tel:${phone.replace(/[^0-9+]/g, "")}`}>{phone}</a>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form className="form" onSubmit={onSubmit} aria-busy={status === "sending"} noValidate>
      {/* Persistent live region so screen readers hear the result. */}
      <div aria-live="assertive" role="alert">
        {status === "err" && <div className="form__status err">{error}</div>}
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor="name">Your name (required)</label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            required
            aria-required="true"
            aria-invalid={!!fieldErrors.name}
            aria-describedby={fieldErrors.name ? "err-name" : undefined}
          />
          {fieldErrors.name && <span className="field__err" id="err-name">{fieldErrors.name}</span>}
        </div>
        <div className="field">
          <label htmlFor="email">Email (required)</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            aria-required="true"
            aria-invalid={!!fieldErrors.email}
            aria-describedby={fieldErrors.email ? "err-email" : undefined}
          />
          {fieldErrors.email && <span className="field__err" id="err-email">{fieldErrors.email}</span>}
        </div>
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor="arrive">Ideal arrival</label>
          <select id="arrive" name="arrive" defaultValue="">
            <option value="">Select a month</option>
            <option>Flexible</option>
            <option>November 2026</option>
            <option>December 2026</option>
            <option>January 2027</option>
            <option>February 2027</option>
            <option>March 2027</option>
            <option>April 2027</option>
            <option>Later in 2027</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="length">Length of stay</label>
          <select id="length" name="length" defaultValue="">
            <option value="">Select a length</option>
            <option>1 month</option>
            <option>2 months</option>
            <option>3 months</option>
            <option>Full season (Nov to Apr)</option>
            <option>Other</option>
          </select>
        </div>
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor="phone">Phone (optional)</label>
          <input id="phone" name="phone" type="tel" autoComplete="tel" />
        </div>
        <div className="field">
          <label htmlFor="guests">Guests</label>
          <select id="guests" name="guests" defaultValue="2">
            <option value="1">1 guest</option>
            <option value="2">2 guests</option>
            <option value="3">3 guests</option>
            <option value="4">4 guests</option>
          </select>
        </div>
      </div>

      <div className="field">
        <label htmlFor="message">Anything you would like us to know</label>
        <textarea id="message" name="message" placeholder="Tell us about your stay." />
      </div>

      {/* honeypot */}
      <div style={{ position: "absolute", left: "-9999px" }} aria-hidden="true">
        <label htmlFor="company">Company</label>
        <input id="company" name="company" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <button className="cta solid" type="submit" disabled={status === "sending"}>
        {status === "sending" ? "Sending..." : "Request your dates"}
      </button>
      <p className="form__note">
        No obligation. We will just send availability and rates for your window. Flexible dates
        welcome. 30 night minimum. We reply personally, usually within a day.
      </p>
    </form>
  );
}
