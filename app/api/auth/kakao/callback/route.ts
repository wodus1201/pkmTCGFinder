import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { appUrl, makeSession, SESSION, sessionCookie } from "@/lib/auth";
import { signIn } from "@/lib/db";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const jar = await cookies();
  const base = appUrl(req);
  const next = decodeURIComponent(jar.get("oauth_next")?.value ?? "/");
  const fail = (reason: string, detail?: unknown) => {
    console.error("[kakao] 로그인 실패:", reason, detail ?? "");
    return NextResponse.redirect(`${base}/?login=failed&reason=${encodeURIComponent(reason)}`, 302);
  };

  if (q.get("error")) return fail(q.get("error")!, q.get("error_description"));
  if (!q.get("code")) return fail("no_code");
  if (q.get("state") !== jar.get("oauth_state")?.value) return fail("state_mismatch");

  const token = await fetch("https://kauth.kakao.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded;charset=utf-8" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: process.env.KAKAO_REST_API_KEY ?? "",
      redirect_uri: `${base}/api/auth/kakao/callback`,
      code: q.get("code")!,
      ...(process.env.KAKAO_CLIENT_SECRET ? { client_secret: process.env.KAKAO_CLIENT_SECRET } : {}),
    }),
  }).then((r) => r.json());
  if (!token.access_token) return fail(token.error_code ?? token.error ?? "token", token);

  const me = await fetch("https://kapi.kakao.com/v2/user/me", { headers: { Authorization: `Bearer ${token.access_token}` } }).then((r) => r.json());
  if (!me.id) return fail("profile", me);
  const profile = me.kakao_account?.profile ?? me.properties ?? {};
  const user = {
    id: `kakao:${me.id}`,
    name: profile.nickname ?? "트레이너",
    image: profile.thumbnail_image_url ?? profile.thumbnail_image ?? "",
  };
  await signIn(user);

  // 리다이렉트 응답에 직접 쿠키를 붙인다 (next/headers의 cookies()로 설정하면 Response.redirect에 실리지 않음)
  const res = NextResponse.redirect(`${base}${next}`, 302);
  res.cookies.set(SESSION, await makeSession(user), sessionCookie);
  res.cookies.delete("oauth_state");
  res.cookies.delete("oauth_next");
  console.log("[kakao] 로그인:", user.id, user.name);
  return res;
}
