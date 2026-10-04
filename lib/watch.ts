import { subscribers, update } from "./db";
import { nearbyStock, type StoreStock } from "./emart24";
import { send } from "./push";

export const stockKey = (storeCode: string, pluCd: string) => `${storeCode}:${pluCd}`;

/** 이번 조회에서 재고가 있는 키 중 지난번에 없던 것만 고른다. */
export function diff(seen: string[], results: StoreStock[]) {
  const before = new Set(seen);
  const now: string[] = [];
  const fresh: { store: StoreStock["store"]; name: string; qty: number }[] = [];
  for (const r of results) {
    for (const item of r.items) {
      const key = stockKey(r.store.code, item.pluCd);
      now.push(key);
      if (!before.has(key)) fresh.push({ store: r.store, name: item.name, qty: item.qty });
    }
  }
  return { now, fresh };
}

export async function checkAll() {
  for (const sub of await subscribers()) {
    const now: string[] = [];
    const messages: string[] = [];
    for (const place of sub.places) {
      const results = await nearbyStock(place.lat, place.lng, place.radiusM);
      const d = diff(sub.seen, results);
      now.push(...d.now);
      for (const f of d.fresh) messages.push(`[${place.name}] 이마트24 ${f.store.name} · ${f.name} ${f.qty}개`);
    }

    let alive = true;
    if (messages.length > 0) {
      alive = await send(sub.subscription, {
        title: `포켓몬 카드 재고 ${messages.length}건 발견`,
        body: messages.slice(0, 4).join("\n") + (messages.length > 4 ? `\n외 ${messages.length - 4}건` : ""),
        url: "/stock",
      });
    }

    await update((db) => {
      const i = db.subscribers.findIndex((s) => s.subscription.endpoint === sub.subscription.endpoint);
      if (i < 0) return;
      if (alive) db.subscribers[i].seen = [...new Set(now)];
      else db.subscribers.splice(i, 1);
    });
  }
}

// ponytail: 서버 프로세스 안의 setInterval. `next start`처럼 계속 떠 있는 서버 전용이고, 서버리스로 옮기면 외부 cron이 /api/check를 부르게 바꾼다.
export function start() {
  const g = globalThis as { __stockWatch?: NodeJS.Timeout };
  if (g.__stockWatch) return;
  const minutes = Number(process.env.CHECK_INTERVAL_MIN) || 10;
  const tick = () => checkAll().catch((e) => console.error("[watch]", e));
  g.__stockWatch = setInterval(tick, minutes * 60 * 1000);
  setTimeout(tick, 5000);
  console.log(`[watch] 재고 확인 시작: ${minutes}분마다`);
}
