"use client";

import { useEffect, useState } from "react";

export default function ArticleTocClient({ items }) {
  const [activeId, setActiveId] = useState(items[0]?.id ?? "");

  useEffect(() => {
    const headingElements = items
      .map((item) => document.getElementById(item.id))
      .filter(Boolean);

    if (!headingElements.length) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visibleEntries[0]?.target?.id) {
          setActiveId(visibleEntries[0].target.id);
        }
      },
      {
        rootMargin: "-120px 0px -60% 0px",
        threshold: [0.1, 0.4, 0.7]
      }
    );

    headingElements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [items]);

  return (
    <nav aria-label="Article table of contents">
      {items.map((item) => (
        <a
          key={item.id}
          href={`#${item.id}`}
          className={activeId === item.id ? "active" : undefined}
        >
          {item.text}
        </a>
      ))}
    </nav>
  );
}
