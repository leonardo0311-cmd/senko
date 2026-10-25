import crypto from "node:crypto";

/**
 * Hashing de contraseñas, aislado de Next para que tambien lo pueda usar el
 * script de seed y cualquier tarea de linea de comandos.
 */

/** scrypt con sal aleatoria. Formato: scrypt$<sal hex>$<hash hex> */
export function hashearPassword(password: string): string {
  const sal = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, sal, 64);
  return `scrypt$${sal.toString("hex")}$${hash.toString("hex")}`;
}

export function verificarPassword(password: string, almacenado: string): boolean {
  const [algoritmo, salHex, hashHex] = almacenado.split("$");
  if (algoritmo !== "scrypt" || !salHex || !hashHex) return false;
  const esperado = Buffer.from(hashHex, "hex");
  const calculado = crypto.scryptSync(password, Buffer.from(salHex, "hex"), esperado.length);
  return crypto.timingSafeEqual(esperado, calculado);
}
