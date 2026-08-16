import Link from "next/link";

const TABS = [
  { href: "/apply", key: "apply", label: "Applying" },
  { href: "/guidebook", key: "guidebook", label: "The guidebook" },
  { href: "/rules", key: "rules", label: "Building rules" },
] as const;

export type GuideTab = (typeof TABS)[number]["key"];

export function GuideNav({ current }: { current: GuideTab }) {
  return (
    <nav className="guidenav" aria-label="Guide sections">
      {TABS.map((t) => (
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
