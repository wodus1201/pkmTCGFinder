import type { Metadata, Viewport } from "next";
import Link from "next/link";
import TabBar from "./tab-bar";
import "./globals.css";

export const metadata: Metadata = {
  title: "포카파인더",
  description: "한글판 포켓몬 카드 도감과 내 주변 편의점 재고 알림",
  appleWebApp: { capable: true, title: "포카파인더", statusBarStyle: "default" },
  icons: { icon: "/icon-192.png", apple: "/icon-192.png" },
};

export const viewport: Viewport = { themeColor: "#ffffff", viewportFit: "cover" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body className="antialiased">
        <div className="mx-auto min-h-dvh max-w-md pb-[calc(72px+env(safe-area-inset-bottom))]">
          <header style={{ viewTransitionName: "site-header" }} className="sticky top-[env(safe-area-inset-top)] z-[900] flex h-14 items-center justify-between border-b border-line bg-white px-5">
            <Link href="/" className="text-[22px] font-black italic tracking-tight text-brand">
              포카파인더
            </Link>
            <Link href="/scan" aria-label="카드 찾기" className="text-ink2">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
            </Link>
          </header>
          {children}
        </div>
        <TabBar />
      </body>
    </html>
  );
}
