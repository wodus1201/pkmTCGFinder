// 실행: npx tsx lib/watch.check.ts
import assert from "node:assert/strict";
import { diff } from "./watch";

const store = { code: "001", name: "역삼점", address: "", lat: 0, lng: 0 };
const item = (pluCd: string, qty: number) => ({ pluCd, name: pluCd, price: 0, qty });
const result = (items: ReturnType<typeof item>[]) => [{ store, distanceM: 0, items }];

// 처음 보는 재고는 알린다
assert.equal(diff([], result([item("A", 2)])).fresh.length, 1);
// 이미 알린 재고는 다시 알리지 않는다
assert.equal(diff(["001:A"], result([item("A", 2)])).fresh.length, 0);
// 품절됐다가(seen에서 빠짐) 다시 들어오면 또 알린다
const soldOut = diff(["001:A"], result([]));
assert.deepEqual(soldOut.now, []);
assert.equal(diff(soldOut.now, result([item("A", 1)])).fresh.length, 1);
console.log("watch diff ok");
