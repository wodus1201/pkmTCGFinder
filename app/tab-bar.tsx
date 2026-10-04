"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const path = (d: string) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-6" aria-hidden>
    <path d={d} />
  </svg>
);

const tabs = [
  { href: "/", label: "홈", icon: path("M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z") },
  { href: "/dex", label: "도감", icon: path("M4 5a2 2 0 0 1 2-2h12v18H6a2 2 0 0 1-2-2zM4 17a2 2 0 0 1 2-2h12M9 7h5") },
  { href: "/scan", label: "스캔", icon: null },
  { href: "/market", label: "거래소", icon: path("M3 17l6-6 4 4 8-8M15 7h6v6") },
  { href: "/stock", label: "재고", icon: path("M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21zM12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z") },
];

export default function TabBar() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-3 bottom-[calc(10px+env(safe-area-inset-bottom))] z-[1000] mx-auto max-w-[calc(28rem-24px)] rounded-3xl border border-line bg-white/95 shadow-[0_8px_30px_rgba(0,0,0,0.08)] backdrop-blur">
      <ul className="grid h-[64px] grid-cols-5 items-center">
        {tabs.map((t) => {
          const active = t.href === "/" ? pathname === "/" : pathname.startsWith(t.href);
          if (!t.icon) {
            return (
              <li key={t.href} className="flex justify-center">
                <Link href={t.href} aria-label={t.label} className="-mt-7 grid size-14 place-items-center rounded-full bg-brand text-white shadow-lg shadow-brand/30">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="size-7" aria-hidden>
                    <path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M9 12h6" />
                  </svg>
                </Link>
              </li>
            );
          }
          return (
            <li key={t.href}>
              <Link href={t.href} className={`flex flex-col items-center gap-0.5 text-[11px] ${active ? "font-semibold text-ink" : "text-sub"}`}>
                {t.icon}
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
