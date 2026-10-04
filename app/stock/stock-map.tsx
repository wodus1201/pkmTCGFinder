"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

type Pt = { lat: number; lng: number };
export type MapProps = {
  center: Pt;
  radiusM: number;
  stores: (Pt & { name: string; inStock: boolean })[];
  machines: (Pt & { name: string })[];
  regions: (Pt & { name: string; radiusM: number })[];
  pending: Pt | null;
  onPick: (p: Pt) => void;
};

export default function StockMap({ center, radiusM, stores, machines, regions, pending, onPick }: MapProps) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const layer = useRef<L.LayerGroup | null>(null);
  const pick = useRef(onPick);
  pick.current = onPick;

  useEffect(() => {
    const m = L.map(el.current!, { zoomControl: false, attributionControl: true }).setView([center.lat, center.lng], 15);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "© OpenStreetMap",
    }).addTo(m);
    m.on("click", (e) => pick.current({ lat: e.latlng.lat, lng: e.latlng.lng }));
    layer.current = L.layerGroup().addTo(m);
    map.current = m;
    return () => {
      m.remove();
      map.current = null;
      layer.current = null;
    };
    // 지도는 한 번만 만들고, 아래 effect에서 위치와 마커만 갱신한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    map.current?.setView([center.lat, center.lng], radiusM > 1500 ? 14 : 15);
  }, [center.lat, center.lng, radiusM]);

  useEffect(() => {
    const g = layer.current;
    if (!g) return;
    g.clearLayers();
    if (radiusM > 0) {
      L.circle([center.lat, center.lng], { radius: radiusM, color: "#2557f5", weight: 1, fillOpacity: 0.05 }).addTo(g);
      L.circleMarker([center.lat, center.lng], { radius: 6, color: "#fff", weight: 2, fillColor: "#2557f5", fillOpacity: 1 }).addTo(g);
    }
    for (const r of regions) {
      L.circle([r.lat, r.lng], { radius: r.radiusM, color: "#8b5cf6", weight: 1, dashArray: "4 4", fillOpacity: 0.04 })
        .bindTooltip(r.name)
        .addTo(g);
    }
    for (const m of machines) {
      L.circleMarker([m.lat, m.lng], { radius: 7, color: "#fff", weight: 2, fillColor: "#f5b400", fillOpacity: 1 })
        .bindPopup(`<b>${escape(m.name)}</b><br>포켓몬 카드 자판기 (재고 정보 없음)`)
        .addTo(g);
    }
    for (const s of stores) {
      L.circleMarker([s.lat, s.lng], {
        radius: s.inStock ? 9 : 5,
        color: "#fff",
        weight: 2,
        fillColor: s.inStock ? "#16a34a" : "#9ca3af",
        fillOpacity: 1,
      })
        .bindPopup(`<b>이마트24 ${escape(s.name)}</b><br>${s.inStock ? "포켓몬 카드 재고 있음" : "재고 없음"}`)
        .addTo(g);
    }
    if (pending) {
      L.circleMarker([pending.lat, pending.lng], { radius: 8, color: "#8b5cf6", weight: 3, fillOpacity: 0 }).addTo(g);
    }
  }, [center.lat, center.lng, radiusM, stores, machines, regions, pending]);

  return <div ref={el} className="h-64 w-full overflow-hidden rounded-2xl" />;
}

function escape(s: string) {
  return s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}
