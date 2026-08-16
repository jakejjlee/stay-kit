import { NextResponse } from "next/server";
import { Resend } from "resend";
import type { Property } from "../content/types";

/**
 * The inquiry endpoint, as a factory so every property gets the same
 * fail-closed contract with its own operator details.
 *
 * Fails loudly by design. An unset mail key must look different on screen from
 * a successful submission, otherwise a site quietly stops capturing leads and
 * nobody finds out for a month.
 */
function esc(s: string) {
  return s.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" })[c] as string);
}

export type InquiryPayload = {
  name?: string; email?: string; phone?: string;
  startDate?: string; length?: string; adults?: string;
  unit?: string; reason?: string; budget?: string;
  pets?: string; vehicles?: string; message?: string;
  company?: string; // honeypot
};

export function createInquireRoute(property: Property) {
  return {
    async POST(req: Request) {
      let body: InquiryPayload;
      try {
        body = await req.json();
      } catch {
        return NextResponse.json({ error: "Invalid request." }, { status: 400 });
      }

      if (body.company) return NextResponse.json({ ok: true }); // honeypot, accept and drop

      const name = (body.name ?? "").trim();
      const email = (body.email ?? "").trim();
      if (!name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
        return NextResponse.json({ error: "Please add your name and a valid email." }, { status: 400 });
      }

      const rows: [string, string][] = ([
        ["Name", name], ["Email", email], ["Phone", body.phone],
        ["Move in", body.startDate], ["Length", body.length], ["Adults", body.adults],
        ["Unit", body.unit], ["Reason for moving", body.reason], ["Budget", body.budget],
        ["Pets", body.pets], ["Vehicles", body.vehicles], ["Message", body.message],
      ] as [string, string | undefined][]).filter((r): r is [string, string] => Boolean(r[1]?.trim()));

      const html = `<div style="font-family:system-ui,sans-serif;color:#1c2a26">
        <h2 style="font-family:Georgia,serif">New inquiry, ${esc(property.name)}</h2>
        <table style="border-collapse:collapse">${rows
          .map(([k, v]) => `<tr><td style="padding:6px 14px 6px 0;color:#5a6660;vertical-align:top">${k}</td><td style="padding:6px 0">${esc(v)}</td></tr>`)
          .join("")}</table></div>`;

      const record = Object.fromEntries(rows);
      const apiKey = process.env.RESEND_API_KEY;

      async function fallback(): Promise<boolean> {
        const hook = process.env.LEAD_FALLBACK_WEBHOOK;
        if (!hook) return false;
        try {
          const r = await fetch(hook, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ source: property.slug, receivedAt: new Date().toISOString(), record }),
          });
          return r.ok;
        } catch { return false; }
      }

      if (!apiKey) {
        console.error(`[${property.slug}/inquire] RESEND_API_KEY not set. Lead:`, JSON.stringify(record));
        if (await fallback()) return NextResponse.json({ ok: true });
        return NextResponse.json(
          { error: `The form is not fully configured yet. Please call or text ${property.operator.phone}.` },
          { status: 503 },
        );
      }

      try {
        const { error } = await new Resend(apiKey).emails.send({
          from: process.env.LEAD_FROM_EMAIL ?? `${property.name} <onboarding@resend.dev>`,
          to: process.env.LEAD_TO_EMAIL ?? property.operator.email,
          replyTo: email,
          subject: `${property.name} inquiry from ${name}`,
          html,
        });
        if (error) throw new Error(error.message);
        return NextResponse.json({ ok: true });
      } catch (err) {
        console.error(`[${property.slug}/inquire] send failed:`, err, JSON.stringify(record));
        if (await fallback()) return NextResponse.json({ ok: true });
        return NextResponse.json(
          { error: `We could not send that just now. Please try again or call ${property.operator.phone}.` },
          { status: 502 },
        );
      }
    },
  };
}
