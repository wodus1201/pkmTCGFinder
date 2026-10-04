import type { Metadata, Viewport } from "next";
import TabBar from "./tab-bar";
import "./globals.css";

export const metadata: Metadata = {
  title: "포카파인더",
  description: "내 주변 편의점 포켓몬 카드 재고 알림",
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
        <div className="mx-auto min-h-dvh max-w-md bg-white pb-[calc(76px+env(safe-area-inset-bottom))]">{children}</div>
        <TabBar />
      </body>
    </html>
  );
}
