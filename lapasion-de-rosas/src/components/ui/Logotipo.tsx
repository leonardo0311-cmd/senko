import { marca } from "@content/site";
import { publico } from "@/lib/rutas";

/**
 * El logotipo de la casa.
 *
 * Si el restaurante entregó su logo, se usa tal cual. Si no, se compone el
 * nombre tipográficamente: nunca se redibuja la marca.
 */
export function Logotipo({ alto, className = "" }: { alto: number; className?: string }) {
  if (marca.logo) {
    const ancho = Math.round((marca.logo.ancho * alto) / marca.logo.alto);
    return (
      <img
        src={publico(marca.logo.src)}
        alt={marca.nombre}
        width={ancho}
        height={alto}
        className={`brand-logo ${className}`.trim()}
        decoding="async"
      />
    );
  }

  return (
    <span className={`brand-word ${className}`.trim()}>
      La Pasión <em>de Rosas</em>
    </span>
  );
}
