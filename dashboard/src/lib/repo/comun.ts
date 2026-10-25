import crypto from "node:crypto";

export function nuevoId(prefijo: string): string {
  return `${prefijo}_${crypto.randomBytes(8).toString("hex")}`;
}

export function ahora(): string {
  return new Date().toISOString();
}

export const bool = (n: number) => n === 1;
export const int = (b: boolean) => (b ? 1 : 0);
