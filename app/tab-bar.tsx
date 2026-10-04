"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const icon = (children: React.ReactNode) => (
  <svg viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    {children}
  </svg>
);

// 도감 앱 하단 탭 구성에서 마지막 "커뮤니티(피드)" 자리를 "재고"로 바꿨다.
const tabs = [
  { href: "/", label: "홈", icon: icon(<><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></>) },
  { href: "/dex", label: "도감", icon: icon(<><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></>) },
  { href: "/scan", label: "스캔", icon: null },
  { href: "/market", label: "거래소", icon: icon(<><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></>) },
  { href: "/stock", label: "재고", icon: icon(<><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></>) },
];

export default function TabBar() {
  const pathname = usePathname();
  return (
    <nav aria-label="주요 화면" style={{ viewTransitionName: "tab-bar" }} className="fixed inset-x-0 bottom-0 z-[1000] mx-auto max-w-md rounded-t-3xl border border-b-0 border-line bg-white pb-[env(safe-area-inset-bottom)]">
      <ul className="flex h-[53px]">
        {tabs.map((t) => {
          const active = t.href === "/" ? pathname === "/" : pathname.startsWith(t.href);
          if (!t.icon) {
            return (
              <li key={t.href} className="flex flex-1 justify-center">
                <Link href={t.href} aria-label="카드 스캔" className="-mt-5 grid size-14 place-items-center rounded-full bg-brand text-white shadow-lg shadow-brand/30">
                  <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                    <path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </Link>
              </li>
            );
          }
          return (
            <li key={t.href} className="flex-1">
              <Link
                href={t.href}
                aria-current={active ? "page" : undefined}
                className={`flex h-full flex-col items-center justify-center gap-1 pt-1 text-[11px] font-semibold ${active ? "text-ink" : "text-faint"}`}
              >
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
