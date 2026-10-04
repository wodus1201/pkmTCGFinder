"use client";

import Link from "next/link";
import { loginUrl, useMe } from "@/lib/collection";

/** 헤더 오른쪽: 로그인 전엔 카카오 로그인 버튼, 로그인 후엔 프로필 */
export default function Account() {
  const { user, ready } = useMe();
  if (!ready) return <span className="size-8" />;
  if (!user)
    return (
      <a href={loginUrl()} onClick={(e) => (e.currentTarget.href = loginUrl())} className="rounded-lg bg-[#FEE500] px-3 py-1.5 text-[13px] font-bold text-[#191919]">
        카카오 로그인
      </a>
    );
  return (
    <Link href="/me" aria-label="내 정보" className="block size-8 overflow-hidden rounded-full bg-soft">
      {user.image ? <img src={user.image} alt="" className="size-full object-cover" /> : <span className="grid size-full place-items-center text-sm font-bold">{user.name[0]}</span>}
    </Link>
  );
}
