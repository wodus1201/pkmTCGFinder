import { randomBytes } from "node:crypto";
import { appUrl } from "@/lib/auth";

/** 카카오 로그인 화면으로 보낸다. ?next=/돌아올경로 */
export async function GET(req: Request) {
  const key = process.env.KAKAO_REST_API_KEY;
  if (!key) return new Response("카카오 로그인이 아직 설정되지 않았어요 (.env.local의 KAKAO_REST_API_KEY)", { status: 503 });
  const next = new URL(req.url).searchParams.get("next") ?? "/";
  const state = randomBytes(16).toString("hex");
  const url = new URL("https://kauth.kakao.com/oauth/authorize");
  url.searchParams.set("client_id", key);
  url.searchParams.set("redirect_uri", `${appUrl(req)}/api/auth/kakao/callback`);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("state", state);
  const headers = new Headers({ Location: url.toString() });
  // state는 위조 요청 방지용, next는 로그인 후 돌아갈 화면
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/";
  headers.append("Set-Cookie", `oauth_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`);
  headers.append("Set-Cookie", `oauth_next=${encodeURIComponent(safeNext)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`);
  return new Response(null, { status: 302, headers });
}
