"use client";

import { logout, useCollection, useMe } from "@/lib/collection";
import { Slide } from "../ui";

export default function MePage() {
  const { user, ready } = useMe();
  const { owned } = useCollection();
  const total = Object.values(owned).reduce((a, b) => a + b, 0);
  return (
    <Slide>
      <main className="px-5 pt-6">
        {ready && !user && <p className="text-[15px] text-sub">로그인이 필요해요.</p>}
        {user && (
          <>
            <div className="flex items-center gap-4">
              {user.image ? <img src={user.image} alt="" className="size-16 rounded-full object-cover" /> : <div className="size-16 rounded-full bg-soft" />}
              <div>
                <p className="text-[22px] font-bold">{user.name}</p>
                <p className="text-[14px] text-sub">카카오 계정으로 로그인됨</p>
              </div>
            </div>
            <div className="mt-6 rounded-xl bg-soft p-4 text-[15px]">
              내 도감에 <b>{total.toLocaleString()}장</b> ({Object.keys(owned).length}종) 저장되어 있어요.
            </div>
            <button onClick={logout} className="mt-6 w-full rounded-xl border border-line py-3 text-[15px] font-semibold text-ink2">
              로그아웃
            </button>
          </>
        )}
      </main>
    </Slide>
  );
}
