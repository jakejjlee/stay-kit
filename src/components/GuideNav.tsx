import Link from "next/link";
import type { ModuleName } from "../content/types";

/**
 * Cross-links between the guest pages. Only renders a tab for a module the
 * property actually has, so a building with no association rules does not
 * advertise a rules page that would 404.
 */
const TABS: { href: string; key: ModuleName; label: string }[] = [
  { href: "/apply", key: "apply", label: "Applying" },
  { href: "/guidebook", key: "guidebook", label: "The guidebook" },
  { href: "/rules", key: "rules", label: "House rules" },
];

export function GuideNav({
  current,
  modules,
}: {
  current: ModuleName;
  modules: ModuleName[];
}) {
  const tabs = TABS.filter((t) => modules.includes(t.key));
  if (tabs.length < 2) return null;

  return (
    <nav className="guidenav" aria-label="Guide sections">
      {tabs.map((t) => (
        <Link
          key={t.key}
          href={t.href}
          className={`guidenav__tab${t.key === current ? " is-current" : ""}`}
          aria-current={t.key === current ? "page" : undefined}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
