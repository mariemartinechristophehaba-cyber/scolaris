// Générateur de QR code (mode octets, correction M, versions 1 à 6 : jusqu'à 106 caractères), sans dépendance.
// D'après l'algorithme public de la norme ISO 18004 (même méthode que la bibliothèque qrcodegen).

const ECC_M = [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26]; // octets de correction par bloc
const BLOCS_M = [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5];

function modulesUtiles(v: number) {
  let r = (16 * v + 128) * v + 64;
  if (v >= 2) { const n = Math.floor(v / 7) + 2; r -= (25 * n - 10) * n - 55; if (v >= 7) r -= 36; }
  return r;
}
const octetsDonnees = (v: number) => Math.floor(modulesUtiles(v) / 8) - ECC_M[v] * BLOCS_M[v];

function gfMul(x: number, y: number) { let z = 0; for (let i = 7; i >= 0; i--) { z = (z << 1) ^ ((z >>> 7) * 0x11d); z ^= ((y >>> i) & 1) * x; } return z & 0xff; }
function diviseur(deg: number) {
  const r = new Array(deg).fill(0); r[deg - 1] = 1; let root = 1;
  for (let i = 0; i < deg; i++) { for (let j = 0; j < r.length; j++) { r[j] = gfMul(r[j], root); if (j + 1 < r.length) r[j] ^= r[j + 1]; } root = gfMul(root, 0x02); }
  return r;
}
function reste(data: number[], div: number[]) {
  const r = div.map(() => 0);
  for (const b of data) { const f = b ^ (r.shift() as number); r.push(0); div.forEach((c, i) => { r[i] ^= gfMul(c, f); }); }
  return r;
}

function positionsAlign(v: number) {
  if (v === 1) return [];
  const n = Math.floor(v / 7) + 2, taille = v * 4 + 17;
  const pas = v === 32 ? 26 : Math.ceil((taille - 13) / (n * 2 - 2)) * 2;
  const r = [6]; for (let p = taille - 7; r.length < n; p -= pas) r.splice(1, 0, p);
  return r;
}

export function qrMatrice(texte: string): boolean[][] {
  const octets = Array.from(new TextEncoder().encode(texte));
  let v = 1; while (v <= 6 && 4 + 8 + octets.length * 8 > octetsDonnees(v) * 8) v++;
  if (v > 6) throw new Error('Texte trop long pour le QR');
  const bits: number[] = []; const ajout = (val: number, n: number) => { for (let i = n - 1; i >= 0; i--) bits.push((val >>> i) & 1); };
  ajout(4, 4); ajout(octets.length, 8); octets.forEach((b) => ajout(b, 8));
  const cap = octetsDonnees(v) * 8;
  ajout(0, Math.min(4, cap - bits.length)); ajout(0, (8 - bits.length % 8) % 8);
  for (let p = 0xec; bits.length < cap; p ^= 0xec ^ 0x11) ajout(p, 8);
  const donnees: number[] = []; for (let i = 0; i < bits.length; i += 8) donnees.push(parseInt(bits.slice(i, i + 8).join(''), 2));
  // Blocs + correction, entrelacés
  const nb = BLOCS_M[v], ecc = ECC_M[v], total = Math.floor(modulesUtiles(v) / 8), courts = nb - total % nb, lgCourt = Math.floor(total / nb);
  const div = diviseur(ecc); const blocs: number[][] = [];
  for (let i = 0, k = 0; i < nb; i++) { const d = donnees.slice(k, k + lgCourt - ecc + (i < courts ? 0 : 1)); k += d.length; const e = reste(d, div); if (i < courts) d.push(0); blocs.push(d.concat(e)); }
  const final: number[] = [];
  for (let i = 0; i < blocs[0].length; i++) blocs.forEach((b, j) => { if (i !== lgCourt - ecc || j >= courts) final.push(b[i]); });
  // Matrice
  const T = v * 4 + 17; const m: boolean[][] = Array.from({ length: T }, () => new Array(T).fill(false)); const fixe: boolean[][] = Array.from({ length: T }, () => new Array(T).fill(false));
  const poser = (x: number, y: number, d: boolean) => { m[y][x] = d; fixe[y][x] = true; };
  for (let i = 0; i < T; i++) { poser(6, i, i % 2 === 0); poser(i, 6, i % 2 === 0); }
  const finder = (x: number, y: number) => { for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) { const d = Math.max(Math.abs(dx), Math.abs(dy)), xx = x + dx, yy = y + dy; if (xx >= 0 && xx < T && yy >= 0 && yy < T) poser(xx, yy, d !== 2 && d !== 4); } };
  finder(3, 3); finder(T - 4, 3); finder(3, T - 4);
  const al = positionsAlign(v);
  al.forEach((a, i) => al.forEach((b, j) => { if ((i === 0 && j === 0) || (i === 0 && j === al.length - 1) || (i === al.length - 1 && j === 0)) return; for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) poser(a + dx, b + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1); }));
  const format = (masque: number) => {
    const d = (0 << 3) | masque; let r = d; for (let i = 0; i < 10; i++) r = (r << 1) ^ ((r >>> 9) * 0x537); const b = ((d << 10) | r) ^ 0x5412; // niveau M = 00
    for (let i = 0; i <= 5; i++) poser(8, i, ((b >>> i) & 1) !== 0);
    poser(8, 7, ((b >>> 6) & 1) !== 0); poser(8, 8, ((b >>> 7) & 1) !== 0); poser(7, 8, ((b >>> 8) & 1) !== 0);
    for (let i = 9; i < 15; i++) poser(14 - i, 8, ((b >>> i) & 1) !== 0);
    for (let i = 0; i < 8; i++) poser(T - 1 - i, 8, ((b >>> i) & 1) !== 0);
    for (let i = 8; i < 15; i++) poser(8, T - 15 + i, ((b >>> i) & 1) !== 0);
    poser(8, T - 8, true);
  };
  format(0);
  // Placement des données en zigzag
  let i = 0;
  for (let droite = T - 1; droite >= 1; droite -= 2) {
    if (droite === 6) droite = 5;
    for (let vert = 0; vert < T; vert++) for (let j = 0; j < 2; j++) {
      const x = droite - j, monte = ((droite + 1) & 2) === 0, y = monte ? T - 1 - vert : vert;
      if (!fixe[y][x] && i < final.length * 8) { m[y][x] = ((final[i >>> 3] >>> (7 - (i & 7))) & 1) !== 0; i++; }
    }
  }
  // Choix du masque qui donne le moins de pénalités
  const appliquer = (k: number) => { for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) { if (fixe[y][x]) continue; const f = [(x + y) % 2 === 0, y % 2 === 0, x % 3 === 0, (x + y) % 3 === 0, (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0, x * y % 2 + x * y % 3 === 0, (x * y % 2 + x * y % 3) % 2 === 0, ((x + y) % 2 + x * y % 3) % 2 === 0][k]; if (f) m[y][x] = !m[y][x]; } };
  const penalite = () => {
    let p = 0;
    const lignes = (get: (a: number, b: number) => boolean) => { for (let a = 0; a < T; a++) { let run = 1; for (let b = 1; b <= T; b++) { if (b < T && get(a, b) === get(a, b - 1)) run++; else { if (run >= 5) p += run - 2; run = 1; } } } };
    lignes((a, b) => m[a][b]); lignes((a, b) => m[b][a]);
    for (let y = 0; y < T - 1; y++) for (let x = 0; x < T - 1; x++) { const c = m[y][x]; if (c === m[y][x + 1] && c === m[y + 1][x] && c === m[y + 1][x + 1]) p += 3; }
    const motif = (get: (a: number, b: number) => boolean) => { for (let a = 0; a < T; a++) for (let b = 0; b + 10 < T; b++) { const s = Array.from({ length: 11 }, (_, k) => get(a, b + k) ? 1 : 0).join(''); if (s === '10111010000' || s === '00001011101') p += 40; } };
    motif((a, b) => m[a][b]); motif((a, b) => m[b][a]);
    let noirs = 0; m.forEach((l) => l.forEach((c) => { if (c) noirs++; }));
    p += Math.floor(Math.abs(noirs * 20 - T * T * 10) / (T * T)) * 10;
    return p;
  };
  let meilleur = 0, min = Infinity;
  for (let k = 0; k < 8; k++) { appliquer(k); format(k); const p = penalite(); if (p < min) { min = p; meilleur = k; } appliquer(k); }
  appliquer(meilleur); format(meilleur);
  return m;
}

// Chemin SVG (un carré par module noir), à poser dans un <svg viewBox="0 0 T T">.
export function qrChemin(texte: string) {
  const m = qrMatrice(texte); let d = '';
  m.forEach((l, y) => { let x = 0; while (x < l.length) { if (l[x]) { const s = x; while (x < l.length && l[x]) x++; d += `M${s} ${y}h${x - s}v1h-${x - s}z`; } else x++; } });
  return { taille: m.length, d };
}
