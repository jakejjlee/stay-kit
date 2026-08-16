export type Env = Record<string, string | undefined>;

/**
 * A hold needs somewhere to live and the kit has no database.
 *
 * If Upstash is not configured the module refuses to render, rather than
 * showing a button that quietly does nothing. An unconfigured integration must
 * look different on screen from a working one.
 */
export function holdConfigured(env: Env): boolean {
  return Boolean(env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN);
}

export function holdKey(propertySlug: string, unitId: string): string {
  return `hold:${propertySlug}:${unitId}`;
}

export type HoldResult = { ok: true; until: string } | { ok: false; reason: string };

export async function placeHold(
  env: Env,
  propertySlug: string,
  unitId: string,
  email: string,
  hours = 72,
): Promise<HoldResult> {
  if (!holdConfigured(env)) return { ok: false, reason: "Holds are not configured on this site." };
  const until = new Date(Date.now() + hours * 3_600_000).toISOString();
  const key = encodeURIComponent(holdKey(propertySlug, unitId));
  // NX so a second person cannot take a unit that is already held.
  const res = await fetch(`${env.UPSTASH_REDIS_REST_URL}/set/${key}?EX=${hours * 3600}&NX=true`, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.UPSTASH_REDIS_REST_TOKEN}` },
    body: JSON.stringify({ email, until }),
  });
  if (!res.ok) return { ok: false, reason: "We could not place that hold just now." };
  const body = (await res.json()) as { result: string | null };
  if (body.result === null) return { ok: false, reason: "Someone else is holding this unit." };
  return { ok: true, until };
}

export async function readHold(env: Env, propertySlug: string, unitId: string) {
  if (!holdConfigured(env)) return null;
  const key = encodeURIComponent(holdKey(propertySlug, unitId));
  const res = await fetch(`${env.UPSTASH_REDIS_REST_URL}/get/${key}`, {
    headers: { Authorization: `Bearer ${env.UPSTASH_REDIS_REST_TOKEN}` },
  });
  if (!res.ok) return null;
  const body = (await res.json()) as { result: string | null };
  return body.result ? (JSON.parse(body.result) as { email: string; until: string }) : null;
}
