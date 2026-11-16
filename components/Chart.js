// Grafik SVG sederhana: batang atau garis
export default function Chart({ type = "bar", title, labels = [], values = [], height = 220 }) {
  const n = Math.min(labels.length, values.length);
  if (!n) return null;
  const vals = values.slice(0, n).map((v) => Number(v) || 0);
  const max = Math.max(1, ...vals);
  const W = Math.max(320, n * 56), H = height, pad = { l: 34, r: 12, t: 22, b: 46 };
  const iw = W - pad.l - pad.r, ih = H - pad.t - pad.b;
  const step = iw / n;
  const y = (v) => pad.t + ih - (v / max) * ih;
  const ticks = [0, 0.5, 1].map((f) => Math.round(max * f));
  return (
    <figure className="w-full overflow-x-auto">
      {title && <figcaption className="mb-2 text-sm font-semibold text-navy">{title}</figcaption>}
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[320px]" role="img" aria-label={title || "grafik"}>
        {ticks.map((t, i) => (
          <g key={i}>
            <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="#E3E7ED" />
            <text x={pad.l - 6} y={y(t) + 4} fontSize="10" textAnchor="end" fill="#5B6778">{t}</text>
          </g>
        ))}
        {type === "line" ? (
          <>
            <polyline fill="none" stroke="#0F2A4A" strokeWidth="2.5" points={vals.map((v, i) => `${pad.l + step * (i + 0.5)},${y(v)}`).join(" ")} />
            {vals.map((v, i) => <circle key={i} cx={pad.l + step * (i + 0.5)} cy={y(v)} r="3.5" fill="#B08D57" />)}
          </>
        ) : (
          vals.map((v, i) => {
            const bw = Math.min(36, step * 0.6);
            return (
              <g key={i}>
                <rect x={pad.l + step * (i + 0.5) - bw / 2} y={y(v)} width={bw} height={Math.max(0, pad.t + ih - y(v))} rx="4" fill={i === n - 1 ? "#B08D57" : "#0F2A4A"} />
                {v > 0 && <text x={pad.l + step * (i + 0.5)} y={y(v) - 5} fontSize="10" textAnchor="middle" fill="#1F2937">{v}</text>}
              </g>
            );
          })
        )}
        {labels.slice(0, n).map((l, i) => (
          <text key={i} x={pad.l + step * (i + 0.5)} y={H - pad.b + 16} fontSize="10" textAnchor="middle" fill="#5B6778">{String(l).slice(0, 12)}</text>
        ))}
      </svg>
    </figure>
  );
}
