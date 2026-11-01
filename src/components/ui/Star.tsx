/** Estrella de puntas rectas de la identidad original. */
function starPath(points = 6, inner = 0.3, size = 100) {
  const r = size / 2;
  const step = Math.PI / points;
  let d = "";
  for (let i = 0; i < points * 2; i++) {
    const radius = i % 2 === 0 ? r : r * inner;
    const a = i * step - Math.PI / 2;
    d += `${i === 0 ? "M" : "L"}${(r + Math.cos(a) * radius).toFixed(2)} ${(r + Math.sin(a) * radius).toFixed(2)} `;
  }
  return `${d}Z`;
}

export default function Star({ className, points = 6, inner = 0.28 }: { className?: string; points?: number; inner?: number }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true" focusable="false">
      <path d={starPath(points, inner)} fill="currentColor" />
    </svg>
  );
}
