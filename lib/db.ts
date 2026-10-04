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
  owner: string; // 글쓴이 카카오 계정 ID. 본인 글 삭제 확인용이라 목록 응답에는 넣지 않는다.
  author?: string; // 글쓴이 닉네임
  authorImage?: string;
};
export type Account = { id: string; name: string; image: string; createdAt: number; lastLogin: number };
type Db = {
  subscribers: Subscriber[];
  posts?: Post[];
  users?: Record<string, Account>;
  collections?: Record<string, Record<string, number>>; // 사용자 ID → 카드 ID → 보유 장수
  collection?: Record<string, number>; // 로그인 도입 전 저장분. 첫 로그인 사용자에게 옮긴 뒤 지운다.
};

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
export const collectionOf = (userId: string) => read().then((db) => db.collections?.[userId] ?? {});

/** 로그인할 때 계정 정보를 저장한다. 로그인 전에 쓰던 보유 카드가 있으면 이 계정으로 옮긴다. */
export function signIn(user: { id: string; name: string; image: string }) {
  return update((db) => {
    const users = (db.users ??= {});
    const now = Date.now();
    users[user.id] = { ...user, createdAt: users[user.id]?.createdAt ?? now, lastLogin: now };
    const cols = (db.collections ??= {});
    if (db.collection && Object.keys(db.collection).length && !Object.keys(cols[user.id] ?? {}).length) {
      cols[user.id] = db.collection;
      delete db.collection;
    }
  });
}
