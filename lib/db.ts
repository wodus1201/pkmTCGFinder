// ponytail: JSON 파일 하나를 DB로 쓴다. 서버 한 대·사용자 소수 기준이고, 배포 규모가 커지면 SQLite/Postgres로 옮긴다.
import { mkdir, readFile, writeFile } from "node:fs/promises";
import type { PushSubscription } from "web-push";

export type Place = { id: string; name: string; lat: number; lng: number; radiusM: number };
export type Subscriber = {
  subscription: PushSubscription;
  places: Place[]; // "here"는 앱을 마지막으로 연 위치, 나머지는 사용자가 저장한 관심 지역
  seen: string[]; // 이미 알린 "매장코드:상품코드" (재고가 0이 되면 빠지고, 다시 생기면 또 알림)
};
export type Post = {
  id: string;
  kind: "sell" | "buy";
  title: string;
  price: number | null;
  grade: string; // A급, B급, PSA 10 등
  qty: number;
  body: string;
  contact: string;
  card: { id: string; name: string; image: string } | null;
  createdAt: number;
  owner: string; // 글쓴이 브라우저의 임의 토큰. 본인 글 삭제 확인용이라 목록 응답에는 넣지 않는다.
};
type Db = { subscribers: Subscriber[]; posts?: Post[] };

const FILE = "data/db.json";
let queue = Promise.resolve();

async function read(): Promise<Db> {
  try {
    return JSON.parse(await readFile(FILE, "utf8"));
  } catch {
    return { subscribers: [] };
  }
}

// 읽기-수정-쓰기를 직렬화해서 동시 요청이 서로의 변경을 덮어쓰지 않게 한다.
export function update<T>(fn: (db: Db) => T): Promise<T> {
  const run = queue.then(async () => {
    const db = await read();
    const result = fn(db);
    await mkdir("data", { recursive: true });
    await writeFile(FILE, JSON.stringify(db, null, 2));
    return result;
  });
  queue = run.then(() => undefined, () => undefined);
  return run;
}

export const subscribers = () => read().then((db) => db.subscribers);
export const posts = () => read().then((db) => db.posts ?? []);
