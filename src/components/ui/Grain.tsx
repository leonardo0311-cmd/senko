export default function Grain({ opacity = 0.07 }: { opacity?: number }) {
  return <div className="grain" style={{ opacity }} aria-hidden="true" />;
}
