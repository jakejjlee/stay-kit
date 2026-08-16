"use client";

import { useEffect, useState } from "react";


export default function StickyHeader({
  links,
  wordmark,
  phone,
}: {
  links: [href: string, label: string][];
  wordmark: string;
  phone: string;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > window.innerHeight * 0.85);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className={`sitehead${visible ? " visible" : ""}`} aria-hidden={!visible} inert={!visible}>
      <a href="#top" className="brandmark">{wordmark}</a>
      <nav className="sitehead__nav" aria-label="Sections">
        {links.slice(0, 4).map(([href, label]) => (
          <a key={href} href={href}>{label}</a>
        ))}
      </nav>
      <div className="sitehead__actions">
        <a href={`tel:${phone.replace(/[^0-9+]/g, "")}`} className="tel">{phone}</a>
        <a href="#inquire" className="cta solid sm">Request your dates</a>
      </div>
    </div>
  );
}
