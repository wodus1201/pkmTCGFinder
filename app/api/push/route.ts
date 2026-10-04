import type { PushSubscription } from "web-push";
import { update, type Place } from "@/lib/db";
import { send, vapidKeys } from "@/lib/push";

export async function GET() {
  return Response.json({ publicKey: (await vapidKeys()).publicKey });
}

// 서버가 이 주소로 요청을 보내므로 브라우저 푸시 서비스 주소만 받는다.
const PUSH_HOSTS = /^(fcm\.googleapis\.com|web\.push\.apple\.com|updates\.push\.services\.mozilla\.com|[\w-]+\.notify\.windows\.com)$/;
function validEndpoint(endpoint: unknown) {
  try {
    const u = new URL(String(endpoint));
    return u.protocol === "https:" && PUSH_HOSTS.test(u.hostname);
  } catch {
    return false;
  }
}

function validPlace(p: Place) {
  return typeof p?.id === "string" && typeof p.name === "string" && Number.isFinite(p.lat) && Number.isFinite(p.lng)
    && p.radiusM > 0 && p.radiusM <= 5000;
}

/** 구독과 감시 위치를 등록/갱신한다. test: true면 테스트 알림도 보낸다. */
export async function POST(req: Request) {
  const { subscription, places, test } = (await req.json()) as {
    subscription: PushSubscription;
    places: Place[];
    test?: boolean;
  };
  if (!validEndpoint(subscription?.endpoint) || !subscription.keys?.p256dh || !Array.isArray(places)) {
    return Response.json({ error: "잘못된 구독 정보예요" }, { status: 400 });
  }
  const clean = places.filter(validPlace).slice(0, 10);

  await update((db) => {
    const existing = db.subscribers.find((s) => s.subscription.endpoint === subscription.endpoint);
    if (existing) Object.assign(existing, { subscription, places: clean });
    else db.subscribers.push({ subscription, places: clean, seen: [] });
  });

  if (test) {
    await send(subscription, { title: "알림이 켜졌어요", body: "포켓몬 카드 재고가 생기면 이렇게 알려드릴게요.", url: "/stock" });
  }
  return Response.json({ ok: true });
}

export async function DELETE(req: Request) {
  const { endpoint } = await req.json();
  await update((db) => {
    db.subscribers = db.subscribers.filter((s) => s.subscription.endpoint !== endpoint);
  });
  return Response.json({ ok: true });
}
