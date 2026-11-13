// Drapeaux dessinés (les émojis drapeau ne s'affichent pas sur Windows : on y voyait « GN »).
const etoile = (cx: number, cy: number, r: number) => {
  const p: string[] = [];
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5; const rr = i % 2 ? r * 0.382 : r; p.push(`${(cx + rr * Math.cos(a)).toFixed(2)},${(cy + rr * Math.sin(a)).toFixed(2)}`); }
  return p.join(' ');
};
const V = (a: string, b: string, c: string) => <><rect width="10" height="20" fill={a} /><rect x="10" width="10" height="20" fill={b} /><rect x="20" width="10" height="20" fill={c} /></>;
const H = (l: string[]) => l.map((c, i) => <rect key={i} y={(20 / l.length) * i} width="30" height={20 / l.length + 0.05} fill={c} />);

const D: Record<string, () => any> = {
  GN: () => V('#CE1126', '#FCD116', '#009460'),
  SN: () => <>{V('#00853F', '#FDEF42', '#E31B23')}<polygon points={etoile(15, 10, 3.6)} fill="#00853F" /></>,
  CI: () => V('#F77F00', '#FFFFFF', '#009E60'),
  ML: () => V('#14B53A', '#FCD116', '#CE1126'),
  BF: () => <>{H(['#EF2B2D', '#009E49'])}<polygon points={etoile(15, 10, 3.6)} fill="#FCD116" /></>,
  BJ: () => <><rect width="30" height="10" fill="#FCD116" /><rect y="10" width="30" height="10" fill="#E8112D" /><rect width="12" height="20" fill="#008751" /></>,
  GW: () => <><rect width="30" height="10" fill="#FCD116" /><rect y="10" width="30" height="10" fill="#009E49" /><rect width="11" height="20" fill="#CE1126" /><polygon points={etoile(5.5, 10, 3.4)} fill="#000" /></>,
  SL: () => H(['#1EB53A', '#FFFFFF', '#0072C6']),
  LR: () => <>{H(['#BF0A30', '#fff', '#BF0A30', '#fff', '#BF0A30', '#fff', '#BF0A30', '#fff', '#BF0A30', '#fff', '#BF0A30'])}<rect width="10" height="9.1" fill="#002868" /><polygon points={etoile(5, 4.6, 2.8)} fill="#fff" /></>,
  GH: () => <>{H(['#CE1126', '#FCD116', '#006B3F'])}<polygon points={etoile(15, 10, 3.3)} fill="#000" /></>,
  NG: () => V('#008751', '#FFFFFF', '#008751'),
  CM: () => <>{V('#007A5E', '#CE1126', '#FCD116')}<polygon points={etoile(15, 10, 3.4)} fill="#FCD116" /></>,
  CG: () => <><rect width="30" height="20" fill="#FBDE4A" /><polygon points="0,0 20,0 0,20" fill="#009543" /><polygon points="30,0 30,20 10,20" fill="#DC241F" /></>,
  CD: () => <><rect width="30" height="20" fill="#007FFF" /><polygon points="0,17 26,0 30,0 30,3 4,20 0,20" fill="#F7D618" /><polygon points="0,18.5 28,0 30,0 30,1.5 2,20 0,20" fill="#CE1021" /><polygon points={etoile(6, 5, 3.2)} fill="#F7D618" /></>,
  CF: () => <>{H(['#003082', '#FFFFFF', '#289728', '#FFCE00'])}<rect x="12.5" width="5" height="20" fill="#D21034" /><polygon points={etoile(4.5, 2.6, 1.9)} fill="#FFCE00" /></>,
  RW: () => <><rect width="30" height="20" fill="#00A1DE" /><rect y="12.5" width="30" height="3.75" fill="#FAD201" /><rect y="16.25" width="30" height="3.75" fill="#20603D" /><circle cx="24" cy="5.5" r="2.6" fill="#FAD201" /></>,
  UG: () => <>{H(['#000', '#FCDC04', '#D90000', '#000', '#FCDC04', '#D90000'])}<circle cx="15" cy="10" r="4" fill="#fff" /></>,
  ZM: () => <><rect width="30" height="20" fill="#198A00" /><rect x="19" y="8" width="3.7" height="12" fill="#DE2010" /><rect x="22.7" y="8" width="3.7" height="12" fill="#000" /><rect x="26.4" y="8" width="3.6" height="12" fill="#EF7D00" /></>,
  MG: () => <><rect width="30" height="10" fill="#FC3D32" /><rect y="10" width="30" height="10" fill="#007E3A" /><rect width="10" height="20" fill="#fff" /></>,
  BW: () => <><rect width="30" height="20" fill="#75AADB" /><rect y="7.6" width="30" height="4.8" fill="#fff" /><rect y="8.4" width="30" height="3.2" fill="#000" /></>,
  MA: () => <><rect width="30" height="20" fill="#C1272D" /><polygon points={etoile(15, 10.4, 5)} fill="none" stroke="#006233" strokeWidth="1" strokeLinejoin="round" /></>,
  TN: () => <><rect width="30" height="20" fill="#E70013" /><circle cx="15" cy="10" r="5" fill="#fff" /><circle cx="15.6" cy="10" r="3.7" fill="#E70013" /><circle cx="16.6" cy="10" r="3" fill="#fff" /><polygon points={etoile(16.8, 10, 2)} fill="#E70013" /></>,
};

export function Drapeau({ c, l = 26 }: { c: string; l?: number }) {
  const f = D[(c || '').toUpperCase()];
  if (!f) return <span className="dra dra-x" style={{ width: l, height: Math.round(l * 2 / 3) }}>{(c || '').toUpperCase()}</span>;
  return <svg className="dra" width={l} height={Math.round(l * 2 / 3)} viewBox="0 0 30 20" aria-hidden="true">{f()}</svg>;
}
