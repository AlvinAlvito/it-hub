import Chart from "./Chart";

// Penyaji markdown ringan untuk jawaban AI: paragraf, poin, tebal, dan blok grafik
function inline(text, key) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) => (p.startsWith("**") && p.endsWith("**") ? <strong key={key + "-" + i}>{p.slice(2, -2)}</strong> : <span key={key + "-" + i}>{p}</span>));
}

export default function Markdown({ text }) {
  const blocks = [];
  const re = /```chart\s*([\s\S]*?)```/g;
  let last = 0, m;
  while ((m = re.exec(text))) {
    blocks.push({ t: "text", v: text.slice(last, m.index) });
    try { blocks.push({ t: "chart", v: JSON.parse(m[1]) }); } catch { /* abaikan grafik yang rusak */ }
    last = m.index + m[0].length;
  }
  blocks.push({ t: "text", v: text.slice(last) });
  return (
    <div className="prose-it text-sm leading-relaxed">
      {blocks.map((b, bi) => {
        if (b.t === "chart") return <div key={bi} className="my-3 rounded-lg border border-hair bg-white p-3"><Chart {...b.v} /></div>;
        const out = [];
        let list = [];
        let rows = [];
        const flush = (k) => { if (list.length) { out.push(<ul key={"u" + k}>{list}</ul>); list = []; } };
        const flushTable = (k) => {
          if (!rows.length) return;
          const [head, ...body] = rows;
          const cell = (c, ci, key) => c.split(/<br\s*\/?>/i).map((part, pi) => <div key={key + ci + "-" + pi}>{inline(part.trim(), key + ci + pi)}</div>);
          out.push(
            <div key={"t" + k} className="my-3 overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead><tr>{head.map((c, ci) => <th key={ci} className="border-b border-hair bg-navy-soft px-2 py-1.5 font-semibold text-navy">{cell(c, ci, "h")}</th>)}</tr></thead>
                <tbody>{body.map((r, ri) => <tr key={ri}>{r.map((c, ci) => <td key={ci} className="border-b border-hair px-2 py-1.5 align-top">{cell(c, ci, "r" + ri)}</td>)}</tr>)}</tbody>
              </table>
            </div>
          );
          rows = [];
        };
        b.v.split("\n").forEach((raw, i) => {
          const line = raw.trimEnd();
          if (/^\s*\|.*\|\s*$/.test(line)) {
            flush(i);
            const cells = line.trim().slice(1, -1).split("|").map((c) => c.trim());
            if (!cells.every((c) => /^:?-{2,}:?$/.test(c))) rows.push(cells);
            return;
          }
          flushTable(i);
          const li = line.match(/^\s*(?:[-*•]|\d+\.)\s+(.*)/);
          if (li) { list.push(<li key={i}>{inline(li[1], bi + "-" + i)}</li>); return; }
          flush(i);
          const h = line.match(/^#{1,4}\s+(.*)/);
          if (h) out.push(<p key={i} className="mt-3 font-semibold text-navy">{inline(h[1], bi + "-" + i)}</p>);
          else if (line.trim()) out.push(<p key={i}>{inline(line, bi + "-" + i)}</p>);
        });
        flush("end");
        flushTable("end");
        return <div key={bi}>{out}</div>;
      })}
    </div>
  );
}
