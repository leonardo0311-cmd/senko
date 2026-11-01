import { useEffect } from "react";
import { siteUrl } from "../data/site";

const DEFAULT_TITLE = "RINDE — Entertainment Marketing | Agencia de marketing para artistas y entretenimiento";

function setMeta(selector: string, attr: "name" | "property", key: string, value: string) {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", value);
}

/** Título, descripción y canonical por página (la web es una SPA). */
export function useSeo({ title, description, path }: { title?: string; description?: string; path: string }) {
  useEffect(() => {
    const t = title ?? DEFAULT_TITLE;
    document.title = t;
    setMeta('meta[property="og:title"]', "property", "og:title", t);
    if (description) {
      setMeta('meta[name="description"]', "name", "description", description);
      setMeta('meta[property="og:description"]', "property", "og:description", description);
    }
    const url = `${siteUrl}${path}`;
    setMeta('meta[property="og:url"]', "property", "og:url", url);
    let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = document.createElement("link");
      link.rel = "canonical";
      document.head.appendChild(link);
    }
    link.href = url;
  }, [title, description, path]);
}
