// 실행: npx tsx lib/auth.check.ts  — 세션 쿠키 서명이 위조를 막는지 확인
import assert from "node:assert/strict";
import { makeSession, readSession } from "./auth";

async function main() {
  const user = { id: "kakao:1", name: "지우", image: "" };
  const s = await makeSession(user);
  assert.deepEqual(await readSession(s), user);
  const [payload, mac] = s.split(".");
  const forged = Buffer.from(JSON.stringify({ ...user, id: "kakao:2", exp: Date.now() + 1e9 })).toString("base64url");
  assert.equal(await readSession(`${forged}.${mac}`), null);
  assert.equal(await readSession(`${payload}.x${mac.slice(1)}`), null);
  assert.equal(await readSession(undefined), null);
  console.log("auth ok");
}
main();
