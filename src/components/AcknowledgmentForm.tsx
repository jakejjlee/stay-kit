"use client";

import { useRef, useState } from "react";

import { validateAcknowledgment } from "../lib/acknowledge";

type Status = "idle" | "sending" | "ok" | "err";
type FieldErrors = Partial<Record<string, string>>;

export function AcknowledgmentForm({ unit }: { unit: string }) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const formRef = useRef<HTMLFormElement>(null);

  function focusField(name: string) {
    const el = formRef.current?.elements.namedItem(name);
    if (el instanceof HTMLElement) el.focus();
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    setError("");
    setFieldErrors({});

    const fd = new FormData(e.currentTarget);
    const payload = {
      names: String(fd.get("names") || ""),
      unit: String(fd.get("unit") || ""),
      email: String(fd.get("email") || ""),
      startDate: String(fd.get("startDate") || ""),
      signature: String(fd.get("signature") || ""),
      accepted: fd.get("accepted") === "on",
      company: String(fd.get("company") || ""),
    };

    // Validate client-side with the SAME pure function the route uses, so a
    // mistake is caught instantly and never depends on what the network says.
    // The server still validates: this is feedback, not trust.
    const check = validateAcknowledgment(payload);
    if (!check.ok) {
      setStatus("err");
      setError(check.message);
      if (check.field !== "form") {
        setFieldErrors({ [check.field]: check.message });
        focusField(check.field);
      }
      return;
    }

    try {
      const res = await fetch("/api/acknowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setStatus("err");
        setError(data.error || "We could not file that just now. Please try again or call us.");
        if (data.field) {
          setFieldErrors({ [data.field]: data.error });
          focusField(data.field);
        }
        return;
      }
      setStatus("ok");
    } catch {
      setStatus("err");
      setError("We could not reach the server. Please try again, or call us so we do not lose it.");
    }
  }

  if (status === "ok") {
    return (
      <div className="ackform__done" role="status">
        <h3>Signed. Thank you.</h3>
        <p>
          Your acknowledgment has been filed with us, and a copy belongs in the association office
          file. If anything about it needs correcting, call us and we will redo it.
        </p>
        <p style={{ marginTop: "1.1rem" }}>
          <button type="button" className="cta line" onClick={() => window.print()}>
            Print a copy for your records
          </button>
        </p>
      </div>
    );
  }

  return (
    <form
      className="form ackform"
      ref={formRef}
      onSubmit={onSubmit}
      aria-busy={status === "sending"}
      noValidate
    >
      <div aria-live="assertive" role="alert">
        {status === "err" && <div className="form__status err">{error}</div>}
      </div>

      <div className="field">
        <label htmlFor="ack-names">Full name of everyone signing</label>
        <input
          id="ack-names"
          name="names"
          type="text"
          autoComplete="name"
          required
          aria-required="true"
          aria-invalid={!!fieldErrors.names}
          aria-describedby={fieldErrors.names ? "err-ack-names" : undefined}
        />
        {fieldErrors.names && (
          <span className="field__err" id="err-ack-names">
            {fieldErrors.names}
          </span>
        )}
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor="ack-unit">Unit</label>
          <input id="ack-unit" name="unit" type="text" defaultValue={unit} readOnly />
        </div>
        <div className="field">
          <label htmlFor="ack-start">Lease start date</label>
          <input
            id="ack-start"
            name="startDate"
            type="date"
            required
            aria-required="true"
            aria-invalid={!!fieldErrors.startDate}
            aria-describedby={fieldErrors.startDate ? "err-ack-start" : undefined}
          />
          {fieldErrors.startDate && (
            <span className="field__err" id="err-ack-start">
              {fieldErrors.startDate}
            </span>
          )}
        </div>
      </div>

      <div className="field">
        <label htmlFor="ack-email">Email</label>
        <input
          id="ack-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          aria-required="true"
          aria-invalid={!!fieldErrors.email}
          aria-describedby={fieldErrors.email ? "err-ack-email" : undefined}
        />
        {fieldErrors.email && (
          <span className="field__err" id="err-ack-email">
            {fieldErrors.email}
          </span>
        )}
      </div>

      <div className="field">
        <label htmlFor="ack-signature">Type your name as your signature</label>
        <input
          id="ack-signature"
          name="signature"
          type="text"
          required
          aria-required="true"
          aria-invalid={!!fieldErrors.signature}
          aria-describedby={
            fieldErrors.signature ? "err-ack-signature" : "hint-ack-signature"
          }
        />
        {fieldErrors.signature ? (
          <span className="field__err" id="err-ack-signature">
            {fieldErrors.signature}
          </span>
        ) : (
          <span className="factlist__note" id="hint-ack-signature">
            It should match the name above.
          </span>
        )}
      </div>

      <div className="check">
        <input
          id="ack-accepted"
          name="accepted"
          type="checkbox"
          aria-invalid={!!fieldErrors.accepted}
          aria-describedby={fieldErrors.accepted ? "err-ack-accepted" : undefined}
        />
        <label htmlFor="ack-accepted">
          I certify that, as tenant or guest of unit #{unit}, I have received and read the
          Rules and Regulations approved by the Association Board.
        </label>
      </div>
      {fieldErrors.accepted && (
        <span className="field__err" id="err-ack-accepted">
          {fieldErrors.accepted}
        </span>
      )}

      {/* Honeypot */}
      <div style={{ position: "absolute", left: "-9999px" }} aria-hidden="true">
        <label htmlFor="ack-company">Company</label>
        <input id="ack-company" name="company" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <button type="submit" className="cta solid" disabled={status === "sending"}>
        {status === "sending" ? "Filing..." : "Sign and file"}
      </button>
    </form>
  );
}
