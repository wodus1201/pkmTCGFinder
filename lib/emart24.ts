// 이마트24 비공식 웹 엔드포인트. hmmhmmhm/daiso-mcp (MIT)의 분석을 참고했고, 예고 없이 막힐 수 있다.
import { mkdir, readFile, writeFile } from "node:fs/promises";

const HEADERS = {
  Accept: "application/json, text/javascript, */*; q=0.01",
  "X-Requested-With": "XMLHttpRequest",
};
const STORES_FILE = "data/emart24-stores.json";
const WEEK = 7 * 24 * 60 * 60 * 1000;

export type Store = { code: string; name: string; address: string; lat: number; lng: number };
export type Product = { pluCd: string; name: string; price: number };
export type StoreStock = {
  store: Store;
  distanceM: number;
  items: (Product & { qty: number })[];
};

// 이마트24 방화벽은 짧은 시간에 요청이 몰리면 IP를 차단한다. 그래서 요청을 한 줄로 세워 간격을 두고,
// 403을 받으면 한동안 아예 요청하지 않는다.
const GAP_MS = 500;
const COOLDOWN_MS = 30 * 60 * 1000;
let line = Promise.resolve();
let blockedUntil = 0;

export class BlockedError extends Error {}

function getJson<T>(url: string, init?: RequestInit): Promise<T> {
  const run = line.then(async () => {
    if (Date.now() < blockedUntil) throw new BlockedError("이마트24가 요청을 잠시 막았어요. 30분 뒤에 다시 시도해 주세요.");
    const res = await fetch(url, { ...init, headers: { ...HEADERS, ...init?.headers }, signal: AbortSignal.timeout(15000) });
    await new Promise((r) => setTimeout(r, GAP_MS));
    if (res.status === 403) {
      blockedUntil = Date.now() + COOLDOWN_MS;
      throw new BlockedError("이마트24가 요청을 잠시 막았어요. 30분 뒤에 다시 시도해 주세요.");
    }
    if (!res.ok) throw new Error(`emart24 ${res.status} ${url}`);
    return res.json() as Promise<T>;
  });
  line = run.then(() => undefined, () => undefined);
  return run;
}

export function distanceM(lat1: number, lng1: number, lat2: number, lng2: number) {
  const rad = (d: number) => (d * Math.PI) / 180;
  const a =
    Math.sin(rad(lat2 - lat1) / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lng2 - lng1) / 2) ** 2;
  return Math.round(6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

type StorePage = { count: number; data?: { CODE: string; TITLE: string; ADDRESS: string; LATITUDE: string; LONGITUDE: string }[] };

// 매장 검색 API가 좌표 검색을 지원하지 않아 전국 매장(약 5,600곳, 140여 페이지)을 일주일에 한 번 받아 파일에 캐시한다.
let storesCache: Promise<Store[]> | null = null;
let storesLoadedAt = 0;
export function allStores(): Promise<Store[]> {
  if (!storesCache || Date.now() - storesLoadedAt > WEEK) {
    storesLoadedAt = Date.now();
    storesCache = loadStores().catch((e) => {
      storesCache = null;
      throw e;
    });
  }
  return storesCache;
}

async function loadStores(): Promise<Store[]> {
  try {
    const cached = JSON.parse(await readFile(STORES_FILE, "utf8"));
    if (Date.now() - cached.savedAt < WEEK) return cached.stores;
  } catch {}

  const page = (n: number) => getJson<StorePage>(`https://emart24.co.kr/api1/store?page=${n}`);
  const first = await page(1);
  const pages = Math.ceil(first.count / (first.data?.length || 40));
  const rows = [...(first.data ?? [])];
  for (let n = 2; n <= pages; n++) rows.push(...((await page(n)).data ?? []));
  const stores = rows
    .map((r) => ({ code: r.CODE, name: r.TITLE, address: r.ADDRESS, lat: +r.LATITUDE, lng: +r.LONGITUDE }))
    .filter((s) => s.code && s.lat && s.lng);

  await mkdir("data", { recursive: true });
  await writeFile(STORES_FILE, JSON.stringify({ savedAt: Date.now(), stores }));
  return stores;
}

let productsCache: { at: number; products: Product[] } | null = null;
export async function pokemonProducts(): Promise<Product[]> {
  if (productsCache && Date.now() - productsCache.at < 6 * 60 * 60 * 1000) return productsCache.products;
  const body = new URLSearchParams({
    currentPage: "1",
    pageCnt: "50",
    sortType: "LATEST",
    saleProductYn: "N",
    searchWord: "포켓몬카드",
  });
  const res = await getJson<{ productList?: { pluCd: string; goodsNm: string; viewPrice: number }[] }>(
    "https://everse.emart24.co.kr/stock/stock/search",
    { method: "POST", body, headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" } },
  );
  const products = (res.productList ?? [])
    .filter((p) => p.goodsNm.includes("포켓몬카드"))
    .map((p) => ({ pluCd: p.pluCd, name: p.goodsNm.replace(/^포켓몬\)/, ""), price: p.viewPrice }));
  productsCache = { at: Date.now(), products };
  return products;
}

async function stockFor(pluCd: string, codes: string[]): Promise<Map<string, number>> {
  const qty = new Map<string, number>();
  for (let i = 0; i < codes.length; i += 20) {
    const res = await getJson<{ storeGoodsQty?: { BIZNO: string; BIZQTY: number }[] }>(
      `https://everse.emart24.co.kr/api/stock/v2/stock-search/store?searchPluCode=${pluCd}&bizNoArr=${codes.slice(i, i + 20).join(",")}`,
    );
    for (const r of res.storeGoodsQty ?? []) qty.set(r.BIZNO, r.BIZQTY);
  }
  return qty;
}

// 같은 좌표를 여러 사람이 동시에 열어도 업스트림을 두드리지 않도록 2분 캐시.
const nearbyCache = new Map<string, { at: number; result: Promise<StoreStock[]> }>();
// 매장 20곳 = 상품당 요청 1번. 상품이 10개 안팎이라 위치 하나 확인에 요청 10번 정도가 든다.
export function nearbyStock(lat: number, lng: number, radiusM: number, maxStores = 20): Promise<StoreStock[]> {
  const key = `${lat.toFixed(3)},${lng.toFixed(3)},${radiusM}`;
  const hit = nearbyCache.get(key);
  if (hit && Date.now() - hit.at < 2 * 60 * 1000) return hit.result;
  const result = fetchNearby(lat, lng, radiusM, maxStores);
  nearbyCache.set(key, { at: Date.now(), result });
  result.catch(() => nearbyCache.delete(key));
  return result;
}

async function fetchNearby(lat: number, lng: number, radiusM: number, maxStores: number): Promise<StoreStock[]> {
  const near = (await allStores())
    .map((store) => ({ store, distanceM: distanceM(lat, lng, store.lat, store.lng) }))
    .filter((s) => s.distanceM <= radiusM)
    .sort((a, b) => a.distanceM - b.distanceM)
    .slice(0, maxStores);
  if (near.length === 0) return [];

  const codes = near.map((s) => s.store.code);
  const products = await pokemonProducts();
  const qtyByProduct: Map<string, number>[] = [];
  for (const p of products) qtyByProduct.push(await stockFor(p.pluCd, codes));

  return near.map(({ store, distanceM }) => ({
    store,
    distanceM,
    items: products
      .map((p, i) => ({ ...p, qty: qtyByProduct[i].get(store.code) ?? 0 }))
      .filter((p) => p.qty > 0),
  }));
}
