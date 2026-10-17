"use client";

import { useIdioma } from "@/lib/idioma";

export function SaltoContenido() {
  const { t } = useIdioma();
  return (
    <a href="#carta" className="skip-link">
      {t("skip_link")}
    </a>
  );
}
