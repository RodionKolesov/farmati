"use client";

import { useEffect, useRef, useState } from "react";

export type CdekPoint = { code: string; address: string; cityCode?: number; city?: string };

declare global {
  interface Window { CDEKWidget?: any; cdekWidget?: any; Widget?: any }
}

const SRC = "https://cdn.jsdelivr.net/npm/@cdek-it/widget@3.11.1/dist/cdek-widget.umd.js";

export default function CdekWidget({
  onChoose,
}: {
  onChoose: (point: CdekPoint, tariffSum: number | null) => void;
}) {
  const created = useRef(false);
  const [err, setErr] = useState<string | null>(null);
  const key = process.env.NEXT_PUBLIC_YANDEX_MAPS_KEY || "";

  useEffect(() => {
    let cancelled = false;

    const getCtor = () => window.CDEKWidget || window.cdekWidget || window.Widget;

    const init = () => {
      if (cancelled || created.current) return;
      const Ctor = getCtor();
      if (!Ctor) return;
      created.current = true;
      try {
        new Ctor({
          root: "cdek-map-root",
          apiKey: key,
          servicePath: "/api/cdek/service",
          defaultLocation: "Москва",
          hideDeliveryOptions: { door: true, office: false },
          debug: false,
          onChoose: (_type: string, tariff: any, target: any) => {
            if (!target?.code) return;
            const sum = tariff ? (tariff.delivery_sum ?? tariff.tariff_sum ?? tariff.total_sum ?? null) : null;
            onChoose(
              { code: String(target.code), address: target.address || "", cityCode: target.city_code, city: target.city },
              sum != null ? Math.round(Number(sum)) : null,
            );
          },
        });
      } catch (e: any) {
        setErr("Не удалось загрузить карту. Обновите страницу.");
        created.current = false;
      }
    };

    if (!key) { setErr("Карта недоступна (не задан ключ Яндекс.Карт)."); return; }

    let s = document.querySelector(`script[src="${SRC}"]`) as HTMLScriptElement | null;
    if (s && getCtor()) {
      init();
    } else {
      if (!s) {
        s = document.createElement("script");
        s.src = SRC;
        s.async = true;
        document.body.appendChild(s);
      }
      s.addEventListener("load", init);
      s.addEventListener("error", () => setErr("Не удалось загрузить виджет СДЭК."));
    }

    return () => { cancelled = true; };
  }, [onChoose, key]);

  return (
    <>
      {err && <p className="msg err" style={{ marginBottom: 8 }}>{err}</p>}
      <div id="cdek-map-root" style={{ width: "100%", height: 480, borderRadius: 12, overflow: "hidden" }} />
    </>
  );
}
