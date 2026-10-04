"use client";

// 다음 페이지가 어느 방향에서 들어올지 기억한다 (app/template.tsx가 읽음).
// 링크를 누를 때 forward/back을 정하고, 브라우저 뒤로가기는 back, 나머지(탭 이동 등)는 fade.
export type NavDir = "forward" | "back" | "fade" | "none";
let dir: NavDir = "fade";

export const setNavDir = (d: NavDir) => {
  dir = d;
};
/** 이번 이동에서 가장 먼저 새로 그려진 template 하나만 방향을 가져가고, 나머지(바깥 template)는 애니메이션 없이. */
export const takeNavDir = (): NavDir => {
  const d = dir;
  dir = "none";
  setTimeout(() => (dir = "fade"), 0);
  return d;
};

if (typeof window !== "undefined") window.addEventListener("popstate", () => setNavDir("back"));
