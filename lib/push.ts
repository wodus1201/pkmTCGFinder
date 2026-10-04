import { mkdir, readFile, writeFile } from "node:fs/promises";
import webpush, { type PushSubscription } from "web-push";

// VAPID 키는 환경변수가 없으면 처음 실행 때 만들어 data/vapid.json에 저장한다. 바꾸면 기존 구독이 모두 무효가 된다.
let keys: Promise<{ publicKey: string; privateKey: string }> | null = null;
export function vapidKeys() {
  keys ??= (async () => {
    if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
      return { publicKey: process.env.VAPID_PUBLIC_KEY, privateKey: process.env.VAPID_PRIVATE_KEY };
    }
    try {
      return JSON.parse(await readFile("data/vapid.json", "utf8"));
    } catch {
      const k = webpush.generateVAPIDKeys();
      await mkdir("data", { recursive: true });
      await writeFile("data/vapid.json", JSON.stringify(k));
      return k;
    }
  })();
  return keys;
}

export type PushPayload = { title: string; body: string; url?: string };

/** 구독이 만료됐으면 false를 돌려준다(호출자가 삭제). */
export async function send(subscription: PushSubscription, payload: PushPayload): Promise<boolean> {
  const { publicKey, privateKey } = await vapidKeys();
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload), {
      vapidDetails: { subject: process.env.VAPID_SUBJECT || "mailto:admin@example.com", publicKey, privateKey },
    });
    return true;
  } catch (e) {
    const status = (e as { statusCode?: number }).statusCode;
    if (status === 404 || status === 410) return false;
    throw e;
  }
}
