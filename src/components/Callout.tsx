import type { ReactNode } from "react";

/**
 * The one line in a section that carries money or safety weight.
 * `money` for a charge or a fee, `safety` for anything with a hazard behind it.
 */
export function Callout({
  tone = "plain",
  children,
}: {
  tone?: "money" | "safety" | "plain";
  children: ReactNode;
}) {
  return (
    <aside className={`callout callout--${tone}`} role="note">
      {children}
    </aside>
  );
}
