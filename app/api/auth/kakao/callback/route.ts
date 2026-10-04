import { cookies } from "next/headers";
import { appUrl, makeSession, SESSION, sessionCookie } from "@/lib/auth";
import { signIn } from "@/lib/db";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const jar = await cookies();
  const base = appUrl(req);
  const next = decodeURIComponent(jar.get("oauth_next")?.value ?? "/");
  if (!q.get("code") || q.get("state") !== jar.get("oauth_state")?.value) return Response.redirect(`${base}/?login=failed`, 302);

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
  if (!token.access_token) {
    console.error("[kakao] token", token);
    return Response.redirect(`${base}/?login=failed`, 302);
  }
  const me = await fetch("https://kapi.kakao.com/v2/user/me", { headers: { Authorization: `Bearer ${token.access_token}` } }).then((r) => r.json());
  const profile = me.kakao_account?.profile ?? me.properties ?? {};
  const user = {
    id: `kakao:${me.id}`,
    name: profile.nickname ?? "트레이너",
    image: profile.thumbnail_image_url ?? profile.thumbnail_image ?? "",
  };
  await signIn(user);

  jar.set(SESSION, await makeSession(user), sessionCookie);
  jar.delete("oauth_state");
  jar.delete("oauth_next");
  return Response.redirect(`${base}${next}`, 302);
}
