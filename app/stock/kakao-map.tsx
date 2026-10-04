"use client";

import { useEffect, useRef, useState } from "react";
import type { MapProps } from "./stock-map";

// 카카오맵 JavaScript SDK. NEXT_PUBLIC_KAKAO_JS_KEY(JavaScript 키)가 있을 때만 쓰고, 없으면 OpenStreetMap(stock-map.tsx)으로 대신한다.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Kakao = any;
declare global {
  interface Window {
    kakao?: Kakao;
  }
}

let sdk: Promise<Kakao> | null = null;
function loadSdk(key: string) {
  sdk ??= new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${key}&autoload=false`;
    s.onload = () => window.kakao!.maps.load(() => resolve(window.kakao));
    s.onerror = () => {
      sdk = null;
      reject(new Error("kakao sdk"));
    };
    document.head.appendChild(s);
  });
  return sdk;
}

const dot = (color: string, size: number, title: string) => {
  const el = document.createElement("div");
  el.title = title;
  el.style.cssText = `width:${size}px;height:${size}px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,.3);transform:translate(-50%,-50%)`;
  return el;
};

export default function KakaoMap({ center, radiusM, stores, machines, regions, pending, onPick, onFail }: MapProps & { onFail: () => void }) {
  const el = useRef<HTMLDivElement>(null);
  const [kakao, setKakao] = useState<Kakao>(null);
  const map = useRef<Kakao>(null);
  const layers = useRef<Kakao[]>([]);
  const pick = useRef(onPick);
  pick.current = onPick;

  useEffect(() => {
    loadSdk(process.env.NEXT_PUBLIC_KAKAO_JS_KEY!)
      .then((k) => {
        map.current = new k.maps.Map(el.current, { center: new k.maps.LatLng(center.lat, center.lng), level: 4 });
        k.maps.event.addListener(map.current, "click", (e: Kakao) => pick.current({ lat: e.latLng.getLat(), lng: e.latLng.getLng() }));
        setKakao(k);
      })
      .catch(onFail);
    // 지도는 한 번만 만든다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!kakao || !map.current) return;
    map.current.setCenter(new kakao.maps.LatLng(center.lat, center.lng));
    map.current.setLevel(radiusM > 1500 ? 6 : radiusM > 700 ? 5 : 4);
  }, [kakao, center.lat, center.lng, radiusM]);

  useEffect(() => {
    if (!kakao || !map.current) return;
    for (const l of layers.current) l.setMap(null);
    const add = (l: Kakao) => (l.setMap(map.current), layers.current.push(l));
    layers.current = [];
    const ll = (p: { lat: number; lng: number }) => new kakao.maps.LatLng(p.lat, p.lng);
    const circle = (p: { lat: number; lng: number }, r: number, color: string, dash = false) =>
      add(new kakao.maps.Circle({ center: ll(p), radius: r, strokeWeight: 1, strokeColor: color, strokeStyle: dash ? "dash" : "solid", fillColor: color, fillOpacity: 0.05 }));
    const overlay = (p: { lat: number; lng: number }, node: HTMLElement, z = 1) => add(new kakao.maps.CustomOverlay({ position: ll(p), content: node, zIndex: z }));

    if (radiusM > 0) {
      circle(center, radiusM, "#2253f4");
      overlay(center, dot("#2253f4", 12, "기준 위치"), 5);
    }
    for (const r of regions) circle(r, r.radiusM, "#8b5cf6", true);
    for (const m of machines) overlay(m, dot("#f5b400", 12, `${m.name} (자판기, 재고 정보 없음)`), 2);
    for (const s of stores) overlay(s, dot(s.inStock ? "#16a34a" : "#9ca3af", s.inStock ? 16 : 10, `이마트24 ${s.name} · ${s.inStock ? "재고 있음" : "재고 없음"}`), s.inStock ? 4 : 3);
    if (pending) overlay(pending, dot("#8b5cf6", 14, "새 관심 지역"), 6);
  }, [kakao, center, radiusM, stores, machines, regions, pending]);

  return <div ref={el} className="h-64 w-full overflow-hidden rounded-2xl bg-soft" />;
}
