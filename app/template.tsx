"use client";

import { useLayoutEffect, useRef } from "react";
import { takeNavDir } from "@/lib/nav";

// template은 자기 아래 경로가 바뀔 때마다 새로 그려진다. 새 화면만 살짝 밀어 넣어서 이전 화면 잔상이 생기지 않는다.
// 도감은 /dex → /dex/세트 → /dex/세트/카드처럼 깊어지므로 app/dex, app/dex/[setId]에도 같은 template을 둔다.
let first = true;

export default function Template({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const d = takeNavDir();
    if (first) {
      first = false; // 처음 연 화면은 애니메이션 없이
      return;
    }
    if (d !== "none") ref.current?.classList.add(`page-${d}`);
  }, []);
  return <div ref={ref}>{children}</div>;
}
