"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Place } from "@/lib/db";
import type { StoreStock } from "@/lib/emart24";

const KakaoMap = dynamic(() => import("./kakao-map"), { ssr: false, loading: () => <div className="h-64 animate-pulse rounded-2xl bg-soft" /> });
const OsmMap = dynamic(() => import("./stock-map"), {
  ssr: false,
  loading: () => <div className="h-64 animate-pulse rounded-2xl bg-soft" />,
});

type Pt = { lat: number; lng: number };
type Machine = Pt & { id: string; name: string; addr: string };

const RADII = [500, 1000, 1500, 3000];
const SEOUL = { lat: 37.5665, lng: 126.978 };
const HERE_ID = "here";
const km = (m: number) => (m < 1000 ? `${m}m` : `${(m / 1000).toFixed(1)}km`);

function load<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
}
function save(key: string, v: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(v));
  } catch {}
}

function dist(a: Pt, b: Pt) {
  const rad = (d: number) => (d * Math.PI) / 180;
  const h = Math.sin(rad(b.lat - a.lat) / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lng - a.lng) / 2) ** 2;
  return Math.round(12742000 * Math.asin(Math.sqrt(h)));
}

function urlBase64ToUint8Array(base64: string) {
  const raw = atob((base64 + "=".repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

export default function StockPage() {
  const [here, setHere] = useState<Pt | null>(null);
  const [geoError, setGeoError] = useState("");
  const [radius, setRadius] = useState(1500);
  const [regions, setRegions] = useState<Place[]>([]);
  const [viewId, setViewId] = useState(HERE_ID);
  const [stores, setStores] = useState<StoreStock[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [machines, setMachines] = useState<Machine[]>([]);
  const [pending, setPending] = useState<Pt | null>(null);
  const [pendingName, setPendingName] = useState("");
  const [pendingRadius, setPendingRadius] = useState(1000);
  const [sub, setSub] = useState<PushSubscription | null>(null);
  const [push, setPush] = useState<"unsupported" | "needs-install" | "ready">("unsupported");
  const [pushMsg, setPushMsg] = useState("");
  const [kakaoFailed, setKakaoFailed] = useState(false);

  // 처음 열 때: 저장해 둔 설정, 위치, 자판기 목록, 서비스워커
  useEffect(() => {
    setRadius(load("radius", 1500));
    setRegions(load("regions", []));
    fetch("/api/vending").then((r) => r.json()).then((d) => setMachines(d.machines ?? [])).catch(() => {});
    locate();

    const standalone = matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone;
    const ios = /iPhone|iPad|iPod/.test(navigator.userAgent);
    if ("serviceWorker" in navigator && "PushManager" in window) {
      setPush("ready");
      navigator.serviceWorker
        .register("/sw.js", { scope: "/", updateViaCache: "none" })
        .then((reg) => reg.pushManager.getSubscription())
        .then(setSub)
        .catch(() => {});
    } else if (ios && !standalone) {
      setPush("needs-install");
    }
  }, []);

  function locate() {
    setGeoError("");
    if (!navigator.geolocation) return setGeoError("이 브라우저는 위치를 지원하지 않아요.");
    navigator.geolocation.getCurrentPosition(
      (p) => setHere({ lat: p.coords.latitude, lng: p.coords.longitude }),
      (e) =>
        setGeoError(
          e.code === e.PERMISSION_DENIED
            ? "위치 권한이 막혀 있어요. 아이폰은 설정 → 개인정보 보호 및 보안 → 위치 서비스 → Safari 웹 사이트를 \"앱을 사용하는 동안\"으로 바꾼 뒤 새로고침해 주세요."
            : "위치를 찾지 못했어요. 잠시 후 \"내 위치 찾기\"를 다시 눌러 주세요.",
        ),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  const places: Place[] = useMemo(
    () => [...(here ? [{ id: HERE_ID, name: "내 위치", ...here, radiusM: radius }] : []), ...regions],
    [here, radius, regions],
  );
  const view = places.find((p) => p.id === viewId) ?? places[0];

  const refresh = useCallback(async () => {
    if (!view) return;
    setLoading(true);
    setError("");
    try {
      const r = await fetch(`/api/stock?lat=${view.lat}&lng=${view.lng}&radius=${view.radiusM}`);
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setStores(d.stores);
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : "재고를 불러오지 못했어요.");
    } finally {
      setLoading(false);
    }
  }, [view?.id, view?.lat, view?.lng, view?.radiusM]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    refresh();
  }, [refresh]);

  // 알림을 켠 상태면 위치·관심 지역이 바뀔 때마다 서버에 알려 둔다(앱을 열 때 "내 위치"도 갱신됨).
  useEffect(() => {
    if (sub && places.length) {
      fetch("/api/push", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ subscription: sub, places }) });
    }
  }, [sub, places]);

  async function enablePush() {
    setPushMsg("");
    try {
      if ((await Notification.requestPermission()) !== "granted") return setPushMsg("알림 권한이 거부됐어요. 설정에서 허용해 주세요.");
      const { publicKey } = await fetch("/api/push").then((r) => r.json());
      const reg = await navigator.serviceWorker.ready;
      const s = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(publicKey) });
      await fetch("/api/push", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ subscription: s, places, test: true }) });
      setSub(s);
    } catch {
      setPushMsg("알림을 켜지 못했어요. 잠시 후 다시 시도해 주세요.");
    }
  }

  async function disablePush() {
    if (!sub) return;
    await fetch("/api/push", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ endpoint: sub.endpoint }) });
    await sub.unsubscribe();
    setSub(null);
  }

  function changeRadius(r: number) {
    setRadius(r);
    save("radius", r);
  }

  function addRegion() {
    if (!pending) return;
    const next = [...regions, { id: crypto.randomUUID(), name: pendingName.trim() || `관심 지역 ${regions.length + 1}`, ...pending, radiusM: pendingRadius }];
    setRegions(next);
    save("regions", next);
    setPending(null);
    setPendingName("");
  }

  function removeRegion(id: string) {
    const next = regions.filter((r) => r.id !== id);
    setRegions(next);
    save("regions", next);
    if (viewId === id) setViewId(HERE_ID);
  }

  const inStock = (stores ?? []).filter((s) => s.items.length > 0);
  const empty = (stores ?? []).length - inStock.length;
  const nearMachines = view
    ? machines.map((m) => ({ ...m, d: dist(view, m) })).filter((m) => m.d < 10000).sort((a, b) => a.d - b.d).slice(0, 5)
    : [];

  return (
    <main className="px-5 pt-6">
      <header className="flex items-end justify-between">
        <h1 className="text-2xl font-extrabold tracking-tight">재고</h1>
        <button onClick={refresh} disabled={loading} className="text-sm font-medium text-brand disabled:text-sub">
          {loading ? "확인 중…" : "새로고침"}
        </button>
      </header>
      <p className="mt-1 text-sm text-sub">이마트24 매장의 포켓몬 카드 재고를 보여드려요.</p>

      {/* 보는 위치 */}
      <div className="-mx-5 mt-4 flex gap-2 overflow-x-auto px-5 pb-1">
        {places.map((p) => (
          <button
            key={p.id}
            onClick={() => setViewId(p.id)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-semibold ${view?.id === p.id ? "bg-ink text-white" : "bg-soft text-ink"}`}
          >
            {p.name}
          </button>
        ))}
        {!here && (
          <button onClick={locate} className="shrink-0 rounded-full bg-soft px-3.5 py-1.5 text-sm font-semibold text-brand">
            내 위치 찾기
          </button>
        )}
      </div>
      {geoError && <p className="mt-2 text-sm text-sub">{geoError}</p>}

      {view?.id === HERE_ID && (
        <div className="mt-3 flex items-center gap-1.5 text-sm">
          <span className="text-sub">반경</span>
          {RADII.map((r) => (
            <button key={r} onClick={() => changeRadius(r)} className={`rounded-md px-2 py-1 ${radius === r ? "bg-brand/10 font-semibold text-brand" : "text-sub"}`}>
              {km(r)}
            </button>
          ))}
        </div>
      )}

      <section className="mt-3">
          <StockMap
            useKakao={Boolean(process.env.NEXT_PUBLIC_KAKAO_JS_KEY) && !kakaoFailed}
            onKakaoFail={() => setKakaoFailed(true)}
            center={view ?? SEOUL}
            radiusM={view?.radiusM ?? 0}
            stores={(stores ?? []).map((s) => ({ lat: s.store.lat, lng: s.store.lng, name: s.store.name, inStock: s.items.length > 0 }))}
            machines={machines}
            regions={regions.filter((r) => r.id !== view?.id)}
            pending={pending}
            onPick={setPending}
          />
          <p className="mt-2 text-xs text-sub">
            <span className="text-green-600">●</span> 재고 있음 <span className="ml-2 text-gray-400">●</span> 재고 없음
            <span className="ml-2 text-amber-500">●</span> 자판기 · 지도를 누르면 관심 지역으로 추가할 수 있어요
          </p>
      </section>

      {pending && (
        <section className="mt-3 rounded-2xl border border-violet-200 bg-violet-50 p-4">
          <p className="text-sm font-semibold">이 위치를 관심 지역으로 추가할까요?</p>
          <input
            value={pendingName}
            onChange={(e) => setPendingName(e.target.value)}
            placeholder="이름 (예: 회사, 학교)"
            className="mt-2 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-brand"
          />
          <div className="mt-2 flex items-center gap-1.5 text-sm">
            <span className="text-sub">반경</span>
            {RADII.map((r) => (
              <button key={r} onClick={() => setPendingRadius(r)} className={`rounded-md px-2 py-1 ${pendingRadius === r ? "bg-violet-600 font-semibold text-white" : "text-sub"}`}>
                {km(r)}
              </button>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <button onClick={addRegion} className="flex-1 rounded-xl bg-violet-600 py-2.5 text-sm font-semibold text-white">추가</button>
            <button onClick={() => setPending(null)} className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-sub">취소</button>
          </div>
        </section>
      )}

      {/* 재고 목록 */}
      <section className="mt-6">
        <h2 className="text-lg font-bold">
          재고 있는 매장 <span className="text-brand">{stores ? inStock.length : "–"}</span>
        </h2>
        {error && <p className="mt-2 rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</p>}
        {!view && !geoError && <p className="mt-2 text-sm text-sub">위치를 찾는 중이에요…</p>}
        {stores && inStock.length === 0 && !error && (
          <p className="mt-2 rounded-xl bg-soft p-4 text-sm text-sub">
            반경 {km(view?.radiusM ?? 0)} 안 이마트24 {stores.length}곳 모두 지금은 재고가 없어요.{" "}
            {sub ? "들어오면 알림으로 알려드릴게요." : "알림을 켜 두면 들어올 때 알려드려요."}
          </p>
        )}
        <ul className="mt-2 divide-y divide-line">
          {inStock.map((s) => (
            <li key={s.store.code} className="py-3">
              <div className="flex items-baseline justify-between">
                <p className="font-semibold">이마트24 {s.store.name}</p>
                <span className="text-sm text-sub">{km(s.distanceM)}</span>
              </div>
              <p className="text-xs text-sub">{s.store.address}</p>
              <ul className="mt-2 space-y-1">
                {s.items.map((i) => (
                  <li key={i.pluCd} className="flex justify-between rounded-lg bg-soft px-3 py-2 text-sm">
                    <span>{i.name}</span>
                    <span className="font-semibold text-green-600">{i.qty}개</span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
        {stores && empty > 0 && inStock.length > 0 && <p className="mt-1 text-xs text-sub">재고 없는 매장 {empty}곳은 지도에 회색으로 표시돼요.</p>}
      </section>

      {/* 자판기 */}
      {nearMachines.length > 0 && (
        <section className="mt-6">
          <h2 className="text-lg font-bold">가까운 포켓몬 카드 자판기</h2>
          <p className="text-xs text-sub">공식 자판기 지도 기준이에요. 자판기는 재고 정보가 공개되지 않아 위치만 보여드려요.</p>
          <ul className="mt-2 divide-y divide-line">
            {nearMachines.map((m) => (
              <li key={m.id} className="flex items-baseline justify-between py-2.5">
                <div>
                  <p className="text-sm font-semibold">{m.name}</p>
                  <p className="text-xs text-sub">{m.addr}</p>
                </div>
                <span className="shrink-0 pl-3 text-sm text-sub">{km(m.d)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 관심 지역 */}
      <section className="mt-6">
        <h2 className="text-lg font-bold">관심 지역</h2>
        {regions.length === 0 ? (
          <p className="mt-1 text-sm text-sub">지도를 눌러 회사나 학교 근처를 추가하면, 그곳에 재고가 생겨도 알려드려요.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {regions.map((r) => (
              <li key={r.id} className="flex items-center justify-between rounded-xl bg-soft px-4 py-3">
                <button onClick={() => setViewId(r.id)} className="text-left">
                  <p className="text-sm font-semibold">{r.name}</p>
                  <p className="text-xs text-sub">반경 {km(r.radiusM)}</p>
                </button>
                <button onClick={() => removeRegion(r.id)} className="text-sm text-sub">삭제</button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 알림 */}
      <section className="mt-6 mb-8 rounded-2xl bg-brand/5 p-4">
        <h2 className="font-bold">재고 알림</h2>
        {push === "needs-install" && (
          <p className="mt-1 text-sm text-sub">아이폰은 공유 버튼에서 “홈 화면에 추가”로 앱을 설치한 뒤 알림을 켤 수 있어요.</p>
        )}
        {push === "unsupported" && <p className="mt-1 text-sm text-sub">이 브라우저는 푸시 알림을 지원하지 않아요.</p>}
        {push === "ready" && (
          <>
            <p className="mt-1 text-sm text-sub">
              {sub
                ? `내 위치(마지막으로 앱을 연 곳)와 관심 지역 ${regions.length}곳에 새 재고가 생기면 알려드려요.`
                : "내 위치와 관심 지역 주변 이마트24에 포켓몬 카드가 들어오면 폰으로 알려드려요."}
            </p>
            {sub ? (
              <button onClick={disablePush} className="mt-3 w-full rounded-xl bg-white py-3 text-sm font-semibold text-sub">알림 끄기</button>
            ) : (
              <button onClick={enablePush} className="mt-3 w-full rounded-xl bg-brand py-3 text-sm font-semibold text-white">알림 켜기</button>
            )}
          </>
        )}
        {pushMsg && <p className="mt-2 text-sm text-red-600">{pushMsg}</p>}
      </section>
    </main>
  );
}

/** 카카오맵 키가 있으면 카카오맵, 없거나 불러오지 못하면 OpenStreetMap */
function StockMap({ useKakao, onKakaoFail, ...props }: import("./stock-map").MapProps & { useKakao: boolean; onKakaoFail: () => void }) {
  return useKakao ? <KakaoMap {...props} onFail={onKakaoFail} /> : <OsmMap {...props} />;
}
