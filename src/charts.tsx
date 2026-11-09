import { useState } from 'react';
import { gnf, nb } from './lib';

const court = (n: number) => (n >= 1e9 ? `${+(n / 1e9).toFixed(1)} Md` : n >= 1e6 ? `${+(n / 1e6).toFixed(n % 1e6 ? 1 : 0)} M` : n >= 1e3 ? `${Math.round(n / 1e3)} k` : String(n));
function pasRond(max: number) { const m = Math.max(max, 3000000); const p = 10 ** Math.floor(Math.log10(m)); for (const f of [1.5, 3, 6, 9, 15]) if (f * p >= m) return f * p; return 15 * p; }
const W = 560, H = 230, G = 46, B = 26, T = 12;

function Axes({ max, n, labels, pas }: any) {
  const lignes = [0, 1, 2, 3].map((i) => (max / 3) * i);
  const dx = (W - G - 8) / n; const mod = n > 8 ? 2 : 1;
  return <>
    {lignes.map((v) => { const y = H - B - (v / max) * (H - B - T); return <g key={v}><line x1={G} x2={W - 8} y1={y} y2={y} className="grille" /><text x={G - 8} y={y + 4} textAnchor="end" className="axe">{court(v)}</text></g>; })}
    {labels.map((l: string, i: number) => (i % mod === 0 ? <text key={i} x={G + dx * (i + (pas ? 0.5 : 0)) + (pas ? 0 : dx / 2)} y={H - 7} textAnchor="middle" className="axe">{l}</text> : null))}
  </>;
}

export function Courbe({ data }: { data: any[] }) {
  const [i, setI] = useState<number | null>(null);
  const max = pasRond(Math.max(...data.map((d) => d.valeur), 0));
  const dx = (W - G - 8) / data.length;
  const X = (k: number) => G + dx * k + dx / 2; const Y = (v: number) => H - B - (v / max) * (H - B - T);
  const pts = data.map((d, k) => `${X(k)},${Y(d.valeur)}`).join(' ');
  const survol = (e: any) => { const r = e.currentTarget.getBoundingClientRect(); const cx = (e.clientX ?? e.touches?.[0]?.clientX) - r.left; const k = Math.floor(((cx / r.width) * W - G) / dx); setI(Math.max(0, Math.min(data.length - 1, k))); };
  return (
    <div className="graph">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Évolution des recettes par mois" onMouseMove={survol} onMouseLeave={() => setI(null)} onTouchStart={survol}>
        <Axes max={max} n={data.length} labels={data.map((d) => d.label)} />
        {data.length > 1 && <polygon points={`${X(0)},${H - B} ${pts} ${X(data.length - 1)},${H - B}`} className="aire" />}
        <polyline points={pts} className="ligne" />
        {data.map((d, k) => <circle key={k} cx={X(k)} cy={Y(d.valeur)} r={i === k ? 7 : 5} className="point" />)}
        {i !== null && <line x1={X(i)} x2={X(i)} y1={T} y2={H - B} className="reticule" />}
      </svg>
      {i !== null && <div className="bulle" style={{ left: `${(X(i) / W) * 100}%` }}><b>{gnf(data[i].valeur)}</b><span>{data[i].label}</span></div>}
    </div>
  );
}

export function Barres({ data }: { data: any[] }) {
  const [i, setI] = useState<number | null>(null);
  const max = pasRond(Math.max(...data.map((d) => d.valeur), 0));
  const dx = (W - G - 8) / data.length; const l = Math.min(26, dx - 6);
  return (
    <div className="graph">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Montants par mois">
        <Axes max={max} n={data.length} labels={data.map((d) => d.label)} pas />
        {data.map((d, k) => {
          const h = (d.valeur / max) * (H - B - T); const x = G + dx * k + (dx - l) / 2;
          return <g key={k} onMouseEnter={() => setI(k)} onMouseLeave={() => setI(null)} onClick={() => setI(k)}>
            <rect x={G + dx * k} y={T} width={dx} height={H - B - T} fill="transparent" />
            {h > 0 && <path className="barre" d={`M${x},${H - B} v${-(h - Math.min(4, h))} q0,${-Math.min(4, h)} ${Math.min(4, h)},${-Math.min(4, h)} h${l - 2 * Math.min(4, h)} q${Math.min(4, h)},0 ${Math.min(4, h)},${Math.min(4, h)} v${h - Math.min(4, h)} z`} />}
          </g>;
        })}
      </svg>
      {i !== null && <div className="bulle" style={{ left: `${((G + dx * (i + 0.5)) / W) * 100}%` }}><b>{gnf(data[i].valeur)}</b><span>{data[i].label}</span></div>}
    </div>
  );
}

const COUL = ['#1D4ED8', '#F59E0B', '#16A34A', '#7C3AED', '#DB2777'];
export function Anneau({ data }: { data: { label: string; valeur: number }[] }) {
  const tot = data.reduce((s, d) => s + d.valeur, 0);
  const top = [...data].sort((a, b) => b.valeur - a.valeur);
  const l = top.length > 5 ? [...top.slice(0, 4), { label: 'Autres', valeur: top.slice(4).reduce((s, d) => s + d.valeur, 0) }] : top;
  const R = 42, C = 2 * Math.PI * R; let cumul = 0;
  return (
    <div className="anneau">
      <svg viewBox="0 0 120 120" role="img" aria-label="Répartition des paiements">
        <circle cx="60" cy="60" r={R} fill="none" stroke="#EEF2F9" strokeWidth="18" />
        {l.map((d, k) => { const part = d.valeur / (tot || 1); const dash = Math.max(part * C - (l.length > 1 ? 1.5 : 0), 0); const el = <circle key={k} cx="60" cy="60" r={R} fill="none" stroke={COUL[k]} strokeWidth="18" strokeDasharray={`${dash} ${C}`} strokeDashoffset={-cumul * C} transform="rotate(-90 60 60)"><title>{`${d.label} : ${nb(d.valeur)} GNF`}</title></circle>; cumul += part; return el; })}
      </svg>
      <ul>{l.map((d, k) => <li key={k}><i style={{ background: COUL[k] }} />{d.label}<b>{tot ? Math.round((d.valeur / tot) * 100) : 0} %</b></li>)}</ul>
    </div>
  );
}

// Jauge de l'objectif, sur le bandeau bleu nuit
export function Jauge({ p, children }: any) {
  const S = 176, E = 18, R_ = (S - E) / 2, C = 2 * Math.PI * R_, d = (Math.min(p, 100) / 100) * C;
  return <div className="jauge"><svg viewBox={`0 0 ${S} ${S}`} aria-hidden="true"><defs><linearGradient id="jg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#2BD98A" /><stop offset="1" stopColor="#8CF5C4" /></linearGradient></defs><circle cx={S / 2} cy={S / 2} r={R_} fill="none" stroke="rgba(255,255,255,.16)" strokeWidth={E} />{d > 0 && <circle cx={S / 2} cy={S / 2} r={R_} fill="none" stroke="url(#jg)" strokeWidth={E} strokeLinecap="round" strokeDasharray={`${d} ${C}`} />}</svg><div>{children}</div></div>;
}

export function Segments({ parts }: { parts: [number, string][] }) {
  const tot = parts.reduce((s, [n]) => s + n, 0);
  if (!tot) return <div className="segments"><i style={{ flex: 1, background: '#E8EDF7' }} /></div>;
  return <div className="segments">{parts.filter(([n]) => n > 0).map(([n, c], i) => <i key={i} style={{ flex: `${n} 1 0`, background: c }} />)}</div>;
}

function courbeLisse(p: [number, number][]) {
  let d = `M${p[0][0]},${p[0][1]}`;
  for (let i = 0; i < p.length - 1; i++) {
    const a = p[i - 1] || p[i], b = p[i], c = p[i + 1], e = p[i + 2] || c;
    d += ` C${b[0] + (c[0] - a[0]) / 6},${b[1] + (c[1] - a[1]) / 6} ${c[0] - (e[0] - b[0]) / 6},${c[1] - (e[1] - b[1]) / 6} ${c[0]},${c[1]}`;
  }
  return d;
}
function pasJoli(max: number) { const b = max / 5; const p = 10 ** Math.floor(Math.log10(b || 1)); for (const f of [1, 2, 2.5, 5, 10]) if (f * p >= b) return f * p; return 10 * p; }

// Encaissements cumulés comparés au rythme prévu pour atteindre l'objectif
export function Cumul({ labels, reel, objectif }: { labels: string[]; reel: number[]; objectif: number }) {
  const [i, setI] = useState<number | null>(null);
  const tel = window.innerWidth <= 860;
  const W_ = tel ? 350 : 640, H_ = tel ? 220 : 270, L = tel ? 44 : 50, R2 = tel ? 8 : 16, T = 20, B = 28, n = labels.length;
  const pas = pasJoli(Math.max(objectif, ...reel, 5000000)); const max = pas * 5;
  const X = (k: number) => L + ((W_ - L - R2) * k) / Math.max(n - 1, 1);
  const Y = (v: number) => H_ - B - ((H_ - B - T) * v) / max;
  const pts: [number, number][] = reel.map((v, k) => [X(k), Y(v)]);
  const dern = pts[pts.length - 1]; const d = pts.length > 1 ? courbeLisse(pts) : '';
  const survol = (e: any) => { const r = e.currentTarget.getBoundingClientRect(); const cx = (e.clientX ?? e.touches?.[0]?.clientX) - r.left; const k = Math.round((((cx / r.width) * W_ - L) / (W_ - L - R2)) * (n - 1)); setI(Math.max(0, Math.min(reel.length - 1, k))); };
  return (
    <div className="graph">
      <svg viewBox={`0 0 ${W_} ${H_}`} role="img" aria-label="Encaissements cumulés par mois" onMouseMove={survol} onMouseLeave={() => setI(null)} onTouchStart={survol}>
        <defs><linearGradient id="cg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1557F0" stopOpacity=".26" /><stop offset="1" stopColor="#1557F0" stopOpacity="0" /></linearGradient></defs>
        {[0, 1, 2, 3, 4, 5].map((k) => <g key={k}><line x1={L} x2={W_ - R2} y1={Y(pas * k)} y2={Y(pas * k)} className="grille" /><text x={L - 10} y={Y(pas * k) + 4} textAnchor="end" className="axe">{court(pas * k)}</text></g>)}
        {labels.map((m, k) => <text key={m} x={X(k)} y={H_ - 6} textAnchor="middle" className="axe">{m}</text>)}
        {d && <path d={`${d} L${dern[0]},${Y(0)} L${pts[0][0]},${Y(0)} Z`} fill="url(#cg)" />}
        {objectif > 0 && <line x1={X(0)} y1={Y(objectif / n)} x2={X(n - 1)} y2={Y(objectif)} className="rythme" />}
        {d && <path d={d} fill="none" stroke="#1557F0" strokeWidth="2.5" strokeLinecap="round" />}
        <circle cx={dern[0]} cy={dern[1]} r="11" fill="#1557F0" fillOpacity=".16" /><circle cx={dern[0]} cy={dern[1]} r="5.5" fill="#1557F0" stroke="#fff" strokeWidth="2.5" />
        {i === null && <g><rect x={dern[0] - 36} y={Math.max(0, dern[1] - 40)} width="72" height="24" rx="12" fill="#0E1E45" /><text x={dern[0]} y={Math.max(0, dern[1] - 40) + 16} textAnchor="middle" className="etq">{court(reel[reel.length - 1])}</text></g>}
        {i !== null && <line x1={X(i)} x2={X(i)} y1={T} y2={Y(0)} className="reticule" />}
      </svg>
      {i !== null && <div className="bulle" style={{ left: `${(X(i) / W_) * 100}%` }}><b>{gnf(reel[i])}</b><span>{labels[i]}</span></div>}
    </div>
  );
}
