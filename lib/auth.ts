// 카카오 로그인(OAuth 인가 코드 방식)과 서명된 쿠키 세션. 외부 인증 라이브러리 없이 직접 구현한다.
// 필요한 환경변수(.env.local): KAKAO_REST_API_KEY, (선택) KAKAO_CLIENT_SECRET, APP_URL(고정 주소, 예: https://poka.example.com)
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { cookies } from "next/headers";

export type User = { id: string; name: string; image: string };
export const SESSION = "session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30일

// 세션 서명 키: AUTH_SECRET이 없으면 처음 실행 때 data/auth-secret.txt에 만든다 (서버를 옮길 때 data/와 함께 옮길 것).
let secret: Promise<string> | null = null;
function getSecret() {
  secret ??= (async () => {
    if (process.env.AUTH_SECRET) return process.env.AUTH_SECRET;
    try {
      return (await readFile("data/auth-secret.txt", "utf8")).trim();
    } catch {
      const s = randomBytes(32).toString("hex");
      await mkdir("data", { recursive: true });
      await writeFile("data/auth-secret.txt", s);
      return s;
    }
  })();
  return secret;
}

const sign = async (payload: string) => createHmac("sha256", await getSecret()).update(payload).digest("base64url");

export async function makeSession(user: User) {
  const payload = Buffer.from(JSON.stringify({ ...user, exp: Date.now() + MAX_AGE * 1000 })).toString("base64url");
  return `${payload}.${await sign(payload)}`;
}

export async function readSession(value: string | undefined): Promise<User | null> {
  if (!value) return null;
  const [payload, mac] = value.split(".");
  if (!payload || !mac) return null;
  const expected = Buffer.from(await sign(payload));
  const given = Buffer.from(mac);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (data.exp < Date.now()) return null;
    return { id: data.id, name: data.name, image: data.image };
  } catch {
    return null;
  }
}

/** 지금 요청의 로그인 사용자 (라우트 핸들러·서버 컴포넌트에서) */
export async function currentUser() {
  return readSession((await cookies()).get(SESSION)?.value);
}

export const sessionCookie = { httpOnly: true, secure: true, sameSite: "lax" as const, path: "/", maxAge: MAX_AGE };

/** 카카오에 등록할 "Redirect URI"와 같아야 한다. 고정 주소(APP_URL)가 있으면 그걸 쓴다. */
export function appUrl(req: Request) {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
  const h = req.headers;
  return `${h.get("x-forwarded-proto") ?? "https"}://${h.get("x-forwarded-host") ?? h.get("host")}`;
}
