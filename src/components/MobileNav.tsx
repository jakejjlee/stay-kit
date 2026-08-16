"use client";

import { useEffect, useRef, useState } from "react";



export type NavLink = [href: string, label: string];

export default function MobileNav({
  links,
  pageLinks = [],
}: {
  links: NavLink[];
  pageLinks?: NavLink[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [open]);

  return (
    <div className="mnav" ref={ref}>
      <button
        type="button"
        className="mnav__btn"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span />
        <span />
        <span />
      </button>
      {open && (
        <div className="mnav__panel" role="menu">
          {links.map(([href, label]) => (
            <a
              key={href}
              href={href}
              role="menuitem"
              className={href === "#inquire" ? "go" : ""}
              onClick={() => setOpen(false)}
            >
              {label}
            </a>
          ))}
            {pageLinks.length ? <span className="mnav__divider" role="separator" /> : null}
            {pageLinks.map(([href, label]) => (
              <a key={href} href={href} onClick={() => setOpen(false)}>
                {label}
              </a>
            ))}
        </div>
      )}
    </div>
  );
}
