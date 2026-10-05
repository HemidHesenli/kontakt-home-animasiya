// Kontakt Home personajı (kontakt png.png ilə eyni forma). Bədənin mərkəzi = (0, 0),
// bədən radiusu 220, ayaqqabının altı y = 406. Hər şey "poza" obyektindən çəkilir.

const RENG = { qirmizi: '#FF0A47', qara: '#1A1A1A', ag: '#FFFFFF', agiz: '#8A0026', dil: '#FF7A98' };
const KONTUR = 12;
const AYAQ_ALTI = 406;

function lerp(a, b, k) { return a + (b - a) * k; }
function hamar(k) { k = Math.max(0, Math.min(1, k)); return k * k * (3 - 2 * k); }
function noqte(x, y) { return { x, y }; }
function qarisdir(a, b, k) { return noqte(lerp(a.x, b.x, k), lerp(a.y, b.y, k)); }

// Qara konturlu qalın xətt (qol, ayaq, üz cizgiləri)
function boru(ctx, yol, en, reng) {
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath(); yol(ctx); ctx.strokeStyle = RENG.qara; ctx.lineWidth = en + 2 * KONTUR; ctx.stroke();
  ctx.beginPath(); yol(ctx); ctx.strokeStyle = reng; ctx.lineWidth = en; ctx.stroke();
}

// Qara konturlu dolu fiqur
function fiqur(ctx, yol, reng) {
  ctx.beginPath(); yol(ctx);
  ctx.fillStyle = reng; ctx.fill();
  ctx.lineJoin = 'round'; ctx.lineWidth = KONTUR; ctx.strokeStyle = RENG.qara; ctx.stroke();
}

function daire(x, y, r) { return c => c.arc(x, y, r, 0, Math.PI * 2); }

// Qolun nöqtələri: S çiyin, C əyilmə, H qolun ucu, G əlcək, B baş barmaq.
// s = -1 sol qol, +1 sağ qol. h = { up, point, ang, wave }, yel = yeriş yelləncəyi.
function qolGeo(s, h, yel, t) {
  const asagi = { S: noqte(195 * s, 85), C: noqte(265 * s, 130), H: noqte(250 * s, 215), G: noqte(250 * s, 242), B: noqte(292 * s, 228) };
  const yuxari = { S: noqte(178 * s, 102), C: noqte(270 * s, 110), H: noqte(270 * s, -30), G: noqte(270 * s, -62), B: noqte(228 * s, -78) };

  const q = {};
  for (const ad in asagi) q[ad] = qarisdir(asagi[ad], yuxari[ad], h.up);
  const qabarma = 40 * s * Math.sin(Math.PI * h.up); // qalxarkən çölə doğru qövs
  const sw = 35 * yel * (1 - h.up) * (1 - h.point) + h.wave * 24 * Math.sin(2 * Math.PI * 2.6 * t);
  for (const ad of ['H', 'G', 'B']) { q[ad].x += sw + qabarma; q[ad].y -= 8 * Math.abs(yel) * (1 - h.up); }
  q.C.x += sw / 2 + qabarma;

  if (h.clap > 0) {
    // başın üstündə əl çalma: aciq = 0 olanda əllər birləşir
    const S = noqte(178 * s, 95), G = noqte(s * (34 + 75 * h.aciq), -300 + 12 * h.aciq);
    const u = Math.hypot(G.x - S.x, G.y - S.y), d = noqte((G.x - S.x) / u, (G.y - S.y) / u);
    const H = noqte(G.x - 30 * d.x, G.y - 30 * d.y);
    const C = noqte((S.x + H.x) / 2 + 70 * s, (S.y + H.y) / 2);
    const B = noqte(G.x + 8 * s, G.y - 42);
    const alqis = { S, C, H, G, B };
    for (const ad in q) q[ad] = qarisdir(q[ad], alqis[ad], hamar(h.clap));
  }

  if (h.point > 0) {
    const d = noqte(Math.cos(h.ang), Math.sin(h.ang));
    const S = noqte(185 * s, 60), uz = 255 + (h.uz || 0);
    const G = noqte(S.x + uz * d.x, S.y + uz * d.y + 6 * Math.sin(2 * Math.PI * 1.5 * t));
    const H = noqte(G.x - 30 * d.x, G.y - 30 * d.y);
    // əyilmə: çiyindən çölə doğru bir az qabarır
    const perp = noqte(-d.y, d.x);
    const yon = perp.x * s >= 0 ? 1 : -1;
    const C = noqte((S.x + H.x) / 2 + 22 * perp.x * yon, (S.y + H.y) / 2 + 22 * perp.y * yon);
    // baş barmaq əlcəyin yuxarı tərəfində
    const pB = perp.y < 0 ? perp : noqte(-perp.x, -perp.y);
    const B = noqte(G.x + 30 * d.x * 0.3 + 40 * pB.x, G.y + 30 * d.y * 0.3 + 40 * pB.y);
    const isare = { S, C, H, G, B };
    for (const ad in q) q[ad] = qarisdir(q[ad], isare[ad], hamar(h.point));
  }
  return q;
}

function qolCek(ctx, q) {
  boru(ctx, c => { c.moveTo(q.S.x, q.S.y); c.quadraticCurveTo(q.C.x, q.C.y, q.H.x, q.H.y); }, 24, RENG.qirmizi);
}

function elcek(ctx, q) {
  fiqur(ctx, daire(q.B.x, q.B.y, 18), RENG.ag);
  fiqur(ctx, daire(q.G.x, q.G.y, 40), RENG.ag);
}

function ayaqqabi(ctx, a, sol) {
  const s = sol ? -1 : 1; // barmaq ucu çölə baxır
  fiqur(ctx, c => {
    c.moveTo(a.x + 82 * s, a.y + 36);
    c.quadraticCurveTo(a.x + 82 * s, a.y - 20, a.x + 24 * s, a.y - 20);
    c.lineTo(a.x - 32 * s, a.y - 20);
    c.lineTo(a.x - 32 * s, a.y + 36);
    c.closePath();
  }, RENG.ag);
}

// Ağız: m = 0 → loqodakı təbəssüm, m > 0 → danışan açıq ağız
function agizCek(ctx, m) {
  const A = noqte(-122, 39), B = noqte(122, 39);
  if (m < 0.04) {
    boru(ctx, c => { c.moveTo(A.x, A.y); c.quadraticCurveTo(0, 168, B.x, B.y); }, 34, RENG.ag);
    return;
  }
  const ust = lerp(150, 40, m), alt = 168 + 70 * m;
  const sekil = c => {
    c.moveTo(A.x, A.y);
    c.quadraticCurveTo(0, ust, B.x, B.y);
    c.quadraticCurveTo(0, alt, A.x, A.y);
    c.closePath();
  };
  boru(ctx, sekil, 30, RENG.ag);
  ctx.beginPath(); sekil(ctx); ctx.fillStyle = RENG.agiz; ctx.fill();
  ctx.save();
  ctx.beginPath(); sekil(ctx); ctx.clip();
  ctx.beginPath(); ctx.ellipse(0, (A.y + alt) / 2 + 38 * m + 18, 70, 34 + 20 * m, 0, 0, Math.PI * 2);
  ctx.fillStyle = RENG.dil; ctx.fill();
  ctx.restore();
}

// p: { x, y, s, bob, sixil, eyil, ayaq:[{dx,lift}x2], sol, sag, yel, goz, agiz, t }
function personajCek(ctx, p) {
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.scale(p.s, p.s);
  ctx.rotate(p.donme || 0);

  // Ayaqlar və ayaqqabılar
  const bud = [noqte(-58, 200 + p.bob), noqte(58, 200 + p.bob)];
  const topuq = [noqte(-68 + p.ayaq[0].dx, 370 - p.ayaq[0].lift), noqte(68 + p.ayaq[1].dx, 370 - p.ayaq[1].lift)];
  for (let i = 0; i < 2; i++) {
    boru(ctx, c => { c.moveTo(bud[i].x, bud[i].y); c.lineTo(topuq[i].x, topuq[i].y); }, 24, RENG.qirmizi);
  }
  ayaqqabi(ctx, topuq[0], true);
  ayaqqabi(ctx, topuq[1], false);

  // Yuxarı hissə: qollar, bədən, üz
  ctx.translate(0, p.bob);
  ctx.translate(0, 200); ctx.rotate(p.eyil); ctx.translate(0, -200);
  ctx.translate(0, 226); ctx.scale(1 + p.sixil, 1 - p.sixil); ctx.translate(0, -226);

  const sol = qolGeo(-1, p.sol, p.yel, p.t), sag = qolGeo(1, p.sag, -p.yel, p.t);
  qolCek(ctx, sol); qolCek(ctx, sag);
  elcek(ctx, sol); elcek(ctx, sag);

  fiqur(ctx, daire(0, 0, 220), RENG.qirmizi);

  const f = p.ifade || {};
  if (f.urek > 0) { // qızarmış yanaqlar
    ctx.save(); ctx.globalAlpha = 0.55 * f.urek; ctx.fillStyle = '#FF9DB5';
    [-1, 1].forEach(k => { ctx.beginPath(); ctx.ellipse(158 * k, 18, 34, 20, 0, 0, Math.PI * 2); ctx.fill(); });
    ctx.restore();
  }

  // gözlər: adi (I və K), ulduz və ya ürək — aralarında "pop" keçidi
  const xus = Math.max(f.ulduz || 0, f.urek || 0);
  const adi = 1 - hamar(xus * 2), ozel = hamar(xus * 2 - 1);
  if (adi > 0) {
    gozCevir(ctx, -59, -63.5, adi, () => {
      const yari = Math.max(1, 46.5 * (1 - p.goz)); // göz qırpanda çubuq qısalır
      boru(ctx, c => { c.moveTo(-59, -63.5 - yari); c.lineTo(-59, -63.5 + yari); }, 34, RENG.ag);
    });
    gozCevir(ctx, 63, -51.5, adi, () => {
      boru(ctx, c => { c.moveTo(80, -93); c.lineTo(46, -52); c.lineTo(80, -10); }, 34, RENG.ag);
    });
  }
  if (ozel > 0) {
    const nabiz = 1 + 0.12 * Math.sin(2 * Math.PI * 3 * p.t);
    [[-62, -62], [68, -62]].forEach(([x, y]) => gozCevir(ctx, x, y, ozel * nabiz, () =>
      (f.urek || 0) >= (f.ulduz || 0) ? urekGoz(ctx, x, y) : ulduzGoz(ctx, x, y, p.t)));
  }
  agizCek(ctx, p.agiz);
  if (f.ter > 0) terDamcilari(ctx, p.t, f.ter);
  ctx.restore();
}

function gozCevir(ctx, x, y, k, ciz) {
  if (k <= 0.01) return;
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k); ctx.translate(-x, -y); ciz(); ctx.restore();
}

function urekGoz(ctx, x, y) {
  fiqur(ctx, c => {
    c.moveTo(x, y + 38);
    c.bezierCurveTo(x - 72, y - 8, x - 34, y - 64, x, y - 26);
    c.bezierCurveTo(x + 34, y - 64, x + 72, y - 8, x, y + 38);
    c.closePath();
  }, RENG.ag);
}

function ulduzGoz(ctx, x, y, t) {
  fiqur(ctx, c => {
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + i * Math.PI / 5 + 0.15 * Math.sin(t * 4), r = i % 2 ? 22 : 54;
      c.lineTo(x + r * Math.cos(a), y + r * Math.sin(a));
    }
    c.closePath();
  }, '#FFD21F');
}

function terDamcilari(ctx, t, k) {
  for (let i = 0; i < 3; i++) {
    const faz = (t * 1.6 + i / 3) % 1;
    const x = [150, 195, -175][i], y = -190 + [0, 70, 30][i] + 140 * faz * faz;
    ctx.save(); ctx.globalAlpha = k * Math.sin(Math.PI * faz);
    fiqur(ctx, c => {
      c.moveTo(x, y - 30);
      c.quadraticCurveTo(x + 22, y + 2, x, y + 14);
      c.quadraticCurveTo(x - 22, y + 2, x, y - 30);
      c.closePath();
    }, '#8FE3FF');
    ctx.restore();
  }
}
