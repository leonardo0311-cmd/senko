import fs from "node:fs";
import path from "node:path";

/**
 * Next carga `.env.local` solo; los scripts de línea de comandos corren sueltos.
 * Este módulo lo lee a mano y tiene que importarse ANTES que cualquier otro,
 * para que SENKO_DB_PATH y TZ ya estén puestos cuando se abra la base.
 */
for (const archivo of [".env.local", ".env"]) {
  const ruta = path.join(process.cwd(), archivo);
  if (!fs.existsSync(ruta)) continue;
  for (const linea of fs.readFileSync(ruta, "utf8").split("\n")) {
    const limpia = linea.trim();
    if (!limpia || limpia.startsWith("#")) continue;
    const corte = limpia.indexOf("=");
    if (corte < 1) continue;
    const clave = limpia.slice(0, corte).trim();
    if (process.env[clave] !== undefined) continue;
    process.env[clave] = limpia.slice(corte + 1).trim().replace(/^["']|["']$/g, "");
  }
  break;
}
