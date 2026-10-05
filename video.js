// Kontakt Home kampaniya videosu: səhnələr, mətnlər, personajın hərəkəti.
// Bütün vaxtlar video saniyəsidir. Səsləndirmə videoda VAXT.ofset saniyə gec başlayır,
// ona görə səsdəki an (a) videoda a + 0.6 olur.

const W = 1080, H = 1920, FPS = 30;
const OFS = 0.6;
const A = a => +(a + OFS).toFixed(2); // səs faylındakı saniyə → video saniyəsi

const VAXT = {
  ofset: OFS, son: 43,
  // A: "Hey, diqqət, diqqət!"
  tullan: 0.42, yer: 0.85, hey: A(0), diqqet1: A(0.5), diqqet2: A(1.09),
  // B: "Möhtəşəm kampaniya başladı!"
  sB: 2.45, mohtesem: A(1.88), kampaniya: A(2.4), basladi: A(3.05),
  // C: "2 oktyabrdan 4 oktyabradək ... 18 aya faizsiz, komissiyasız taksitlə ..."
  sC: 4.45, faizsizSertler: 4.5, tarix: A(3.9) + 0.1, saytda: A(6.07), ay18: A(7.46), faizsiz: A(8.35),
  komissiya: A(9.18), taksit: A(10.2),
  // D: "Artıq arzularınızı təxirə salmağa ehtiyac yoxdur."
  sD: A(11.5), arzu: A(11.6), texire: A(12.9), salmayin: A(13.35),
  // E: LG paltaryuyan maşını
  sE: A(14.4), lgBasliq: A(14.69), ozellik1: A(16.64), ozellik2: A(18.1), ozellik3: A(19.05),
  ayliq: A(21.31), qiymet: A(22.22), ay18LG: A(24.33), elaveYox: A(26.04),
  // F: "Tələsin! ... Sizi gözləyirik!"
  sF: A(27.9), telesin: A(28.22), ucGun: A(28.91), gun2: A(31.03), gun3: A(31.62), gun4: A(32.25),
  sayt: A(33.31), klik: A(34.0), mehsullar: A(34.6), lent: A(36.31), sahib: A(38.6),
  son1: A(39.3), gozleyirik: A(39.53),
};
const Z = VAXT;

const QIYMET = { lg: '52,78', tv: '77,78' };

const SRIFT = '"Segoe UI Black", "Segoe UI", Arial, sans-serif';
const SRIFT_ADI = '"Segoe UI", Arial, sans-serif';
const R = { qirmizi: '#FF0A47', tund: '#1A1A1A', sari: '#FFD21F', goy: '#16213E', boz: '#6B6F76', ag: '#FFFFFF', fonAg: '#F4F5F7' };

const SEKIL = {};   // yüklənmiş şəkillər
let AGIZ = null;    // hər kadr üçün ağız açıqlığı (sesler.js → agizZerfi)

// ---------- köməkçilər ----------
const sixis = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
function geriAt(k) { k = sixis(k); const c1 = 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); }
function cixisYumsaq(k) { k = sixis(k); return 1 - Math.pow(1 - k, 3); }
// 0..1 pəncərəsi: a-da yumşaq açılır, b-də yumşaq bağlanır
function pen(t, a, b, f = 0.3) { return hamar((t - a) / f) * (1 - hamar((t - (b - f)) / f)); }
function tesadufi(i) { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }

function srift(olcu, { italik = true, ceki = 900, ad = SRIFT } = {}) {
  return `${italik ? 'italic ' : ''}${ceki} ${olcu}px ${ad}`;
}

// Konturlu, kölgəli mətn
function yazi(ctx, s, x, y, o = {}) {
  const { olcu = 100, reng = R.ag, kontur = R.tund, kEn = olcu * 0.14, kolge = true, italik = true,
          hiza = 'center', maxEn = 980, ceki = 900, ad = SRIFT } = o;
  ctx.font = srift(olcu, { italik, ceki, ad });
  ctx.textAlign = hiza; ctx.textBaseline = 'middle';
  const en = ctx.measureText(s).width, sc = en > maxEn ? maxEn / en : 1;
  ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc);
  ctx.lineJoin = 'round'; ctx.miterLimit = 2;
  if (kolge && kEn) {
    ctx.fillStyle = kontur; ctx.strokeStyle = kontur; ctx.lineWidth = kEn;
    ctx.strokeText(s, olcu * 0.03, olcu * 0.08); ctx.fillText(s, olcu * 0.03, olcu * 0.08);
  }
  if (kEn) { ctx.strokeStyle = kontur; ctx.lineWidth = kEn; ctx.strokeText(s, 0, 0); }
  ctx.fillStyle = reng; ctx.fillText(s, 0, 0);
  ctx.restore();
  return en * sc;
}

function enOlc(ctx, s, olcu, o = {}) { ctx.font = srift(olcu, o); return ctx.measureText(s).width; }

// Elementin görünməsi: t0-da girir, t1-də çıxır. tip: pop | mohur | sol | sag | asagi
function el(ctx, t, t0, t1, x, y, ciz, { tip = 'pop', rot = 0, giris = 0.4, cixis = 0.25 } = {}) {
  if (t < t0 || t > t1 + cixis) return;
  const ki = sixis((t - t0) / giris), ko = t > t1 ? sixis((t - t1) / cixis) : 0;
  ctx.save();
  ctx.globalAlpha *= sixis(ki * 4) * (1 - ko);
  ctx.translate(x, y);
  if (tip === 'pop') { const s = geriAt(ki) * (1 - 0.35 * ko); ctx.scale(s, s); }
  else if (tip === 'mohur') { const s = (ki < 1 ? lerp(2.2, 1, cixisYumsaq(ki / 0.6 > 1 ? 1 : ki / 0.6)) : 1) * (1 - 0.3 * ko); ctx.scale(s, s); }
  else if (tip === 'sol') ctx.translate(-1200 * (1 - cixisYumsaq(ki)) - 300 * ko, 0);
  else if (tip === 'sag') ctx.translate(1200 * (1 - cixisYumsaq(ki)) + 300 * ko, 0);
  else if (tip === 'asagi') ctx.translate(0, 500 * (1 - cixisYumsaq(ki)) - 120 * ko);
  ctx.rotate(rot);
  ciz(ctx, ki, ko);
  ctx.restore();
}

function hap(ctx, x, y, w, h, reng, { kontur = 0, kolge = false, r = h / 2 } = {}) {
  ctx.save();
  if (kolge) { ctx.shadowColor = 'rgba(0,0,0,0.22)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 12; }
  ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fillStyle = reng; ctx.fill();
  ctx.restore();
  if (kontur) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.lineWidth = kontur; ctx.strokeStyle = R.tund; ctx.stroke(); }
}

// ---------- fonlar ----------
function simsek(ctx, x, y, s, rot, t) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  const k = s * (1 + 0.06 * Math.sin(t * 9 + x));
  ctx.scale(k, k);
  ctx.beginPath();
  ctx.moveTo(-10, -80); ctx.lineTo(38, -80); ctx.lineTo(12, -18); ctx.lineTo(44, -18);
  ctx.lineTo(-22, 86); ctx.lineTo(-4, 6); ctx.lineTo(-36, 6); ctx.closePath();
  ctx.fillStyle = R.sari; ctx.fill();
  ctx.restore();
}

function fonQirmizi(ctx, t) {
  ctx.fillStyle = R.qirmizi; ctx.fillRect(0, 0, W, H);
  const cx = 540, cy = 820, n = 22, r = 2600, don = t * 0.05;
  ctx.fillStyle = 'rgba(255,255,255,0.075)';
  for (let i = 0; i < n; i++) {
    const a0 = don + i * 2 * Math.PI / n, a1 = a0 + Math.PI / n;
    ctx.beginPath(); ctx.moveTo(cx, cy);
    ctx.lineTo(cx + r * Math.cos(a0), cy + r * Math.sin(a0));
    ctx.lineTo(cx + r * Math.cos(a1), cy + r * Math.sin(a1));
    ctx.closePath(); ctx.fill();
  }
  const g = ctx.createRadialGradient(cx, cy, 200, cx, cy, 1300);
  g.addColorStop(0, 'rgba(255,90,130,0.25)'); g.addColorStop(1, 'rgba(110,0,30,0.35)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  simsek(ctx, 95, 170, 1.0, 0.35, t);
  simsek(ctx, 990, 120, 0.8, -0.5, t);
  simsek(ctx, 60, 1180, 0.75, -0.2, t);
  simsek(ctx, 1030, 1050, 0.9, 0.4, t);
}

function fonAg(ctx, t) {
  ctx.fillStyle = R.fonAg; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(255,10,71,0.07)';
  ctx.beginPath(); ctx.arc(1000 + 20 * Math.sin(t * 0.7), 120, 420, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(40, 1500 + 30 * Math.sin(t * 0.5), 330, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(26,26,26,0.06)';
  for (let y = 60; y < H; y += 60) for (let x = 30 + (y / 60 % 2) * 30; x < W; x += 60) {
    ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill();
  }
}

// Fonu çəkir: qırmızı → (sE) ağ dairəvi keçid → (sF) yenidən qırmızı
function fon(ctx, t) {
  const kecid = (bas, kohne, yeni) => {
    const k = (t - bas) / 0.55;
    if (k <= 0) return kohne(ctx, t);
    kohne(ctx, t);
    if (k >= 1) return yeni(ctx, t);
    ctx.save(); ctx.beginPath(); ctx.arc(540, 1000, 1250 * cixisYumsaq(k), 0, Math.PI * 2); ctx.clip();
    yeni(ctx, t); ctx.restore();
  };
  if (t < Z.sF - 0.3) kecid(Z.sE - 0.3, fonQirmizi, fonAg);
  else kecid(Z.sF - 0.3, fonAg, fonQirmizi);
}

// ---------- ikonlar ----------
function teqvimIkon(ctx, x, y, s, reng = R.qirmizi) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.beginPath(); ctx.roundRect(-30, -26, 60, 56, 10); ctx.fillStyle = R.ag; ctx.fill();
  ctx.lineWidth = 6; ctx.strokeStyle = R.tund; ctx.stroke();
  ctx.beginPath(); ctx.roundRect(-30, -26, 60, 18, [10, 10, 0, 0]); ctx.fillStyle = reng; ctx.fill(); ctx.stroke();
  ctx.lineCap = 'round';
  [-14, 14].forEach(dx => { ctx.beginPath(); ctx.moveTo(dx, -36); ctx.lineTo(dx, -18); ctx.stroke(); });
  ctx.fillStyle = R.tund;
  for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) { ctx.fillRect(-18 + i * 14, 2 + j * 13, 8, 8); }
  ctx.restore();
}

function wifiIkon(ctx, s) {
  ctx.save(); ctx.scale(s, s); ctx.strokeStyle = R.ag; ctx.lineWidth = 6; ctx.lineCap = 'round';
  [24, 15, 6].forEach(r => { ctx.beginPath(); ctx.arc(0, 10, r, -Math.PI * 0.78, -Math.PI * 0.22); ctx.stroke(); });
  ctx.beginPath(); ctx.arc(0, 10, 3.5, 0, Math.PI * 2); ctx.fillStyle = R.ag; ctx.fill();
  ctx.restore();
}

function buxarIkon(ctx, s, t) {
  ctx.save(); ctx.scale(s, s); ctx.strokeStyle = R.ag; ctx.lineWidth = 5.5; ctx.lineCap = 'round';
  [-11, 0, 11].forEach((dx, i) => {
    ctx.beginPath();
    for (let y = 16; y >= -16; y -= 2) {
      const x = dx + 4 * Math.sin(y * 0.2 + t * 6 + i);
      y === 16 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
  });
  ctx.restore();
}

function kqIkon(ctx, s) {
  ctx.save(); ctx.scale(s, s);
  ctx.beginPath(); ctx.moveTo(-20, 18); ctx.lineTo(-14, -10); ctx.lineTo(14, -10); ctx.lineTo(20, 18); ctx.closePath();
  ctx.fillStyle = R.ag; ctx.fill();
  ctx.beginPath(); ctx.arc(0, -14, 7, 0, Math.PI * 2); ctx.lineWidth = 4; ctx.strokeStyle = R.ag; ctx.stroke();
  ctx.fillStyle = R.qirmizi; ctx.font = srift(15, { italik: false }); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('KG', 0, 5);
  ctx.restore();
}

function dunyaIkon(ctx, s) {
  ctx.save(); ctx.scale(s, s); ctx.strokeStyle = R.ag; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.arc(0, 0, 24, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(0, 0, 10, 24, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-24, 0); ctx.lineTo(24, 0); ctx.stroke();
  ctx.restore();
}

function kursor(ctx, x, y, s) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.beginPath();
  ctx.moveTo(0, 0); ctx.lineTo(0, 62); ctx.lineTo(15, 48); ctx.lineTo(27, 74); ctx.lineTo(39, 68);
  ctx.lineTo(27, 43); ctx.lineTo(46, 42); ctx.closePath();
  ctx.fillStyle = R.ag; ctx.fill(); ctx.lineWidth = 5; ctx.lineJoin = 'round'; ctx.strokeStyle = R.tund; ctx.stroke();
  ctx.restore();
}

function saat(ctx, s, t) {
  ctx.save(); ctx.scale(s, s);
  ctx.rotate(0.12 * Math.sin(t * 40) * pen(t, Z.telesin, Z.telesin + 0.7, 0.1));
  ctx.lineWidth = 8; ctx.strokeStyle = R.tund;
  [-1, 1].forEach(k => { ctx.beginPath(); ctx.arc(46 * k, -48, 20, 0, Math.PI * 2); ctx.fillStyle = R.sari; ctx.fill(); ctx.stroke(); });
  ctx.beginPath(); ctx.arc(0, 0, 62, 0, Math.PI * 2); ctx.fillStyle = R.ag; ctx.fill(); ctx.stroke();
  ctx.lineCap = 'round';
  const a = t * 3;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(34 * Math.sin(a), -34 * Math.cos(a)); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -24); ctx.strokeStyle = R.qirmizi; ctx.stroke();
  ctx.restore();
}

function urek(ctx, x, y, s, reng) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.beginPath(); ctx.moveTo(0, 30);
  ctx.bezierCurveTo(-60, -10, -30, -55, 0, -22);
  ctx.bezierCurveTo(30, -55, 60, -10, 0, 30);
  ctx.fillStyle = reng; ctx.fill();
  ctx.restore();
}

function ulduz(ctx, x, y, r, reng) { // dörd uclu parıltı
  ctx.save(); ctx.translate(x, y);
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = i * Math.PI / 4, rr = i % 2 ? r * 0.28 : r;
    ctx.lineTo(rr * Math.sin(a), -rr * Math.cos(a));
  }
  ctx.closePath(); ctx.fillStyle = reng; ctx.fill();
  ctx.restore();
}

function ulduzNisan(ctx, r, t, reng = R.qirmizi) { // kənarları dişli endirim nişanı
  ctx.save(); ctx.rotate(t * 0.4);
  ctx.beginPath();
  for (let i = 0; i < 32; i++) { const a = i * Math.PI / 16, rr = i % 2 ? r * 0.88 : r; ctx.lineTo(rr * Math.cos(a), rr * Math.sin(a)); }
  ctx.closePath(); ctx.fillStyle = reng; ctx.fill(); ctx.lineWidth = 8; ctx.strokeStyle = R.tund; ctx.stroke();
  ctx.restore();
}

// Hisense MiniLED televizoru (şəkil yoxdur, vektorla çəkilir). Mərkəz = ekranın mərkəzi.
function televizor(ctx, w, t) {
  const h = w * 9 / 16;
  ctx.save();
  ctx.fillStyle = '#2B2D33';
  [-1, 1].forEach(k => {
    ctx.beginPath();
    ctx.moveTo(k * w * 0.36, h / 2 - 4); ctx.lineTo(k * w * 0.41, h / 2 + w * 0.07);
    ctx.lineTo(k * w * 0.34, h / 2 + w * 0.07); ctx.closePath(); ctx.fill();
  });
  ctx.shadowColor = 'rgba(0,0,0,0.3)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 10;
  ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, w * 0.012); ctx.fillStyle = '#0E0F12'; ctx.fill();
  ctx.restore();

  const b = w * 0.014, sw = w - 2 * b, sh = h - 2 * b - w * 0.012;
  ctx.save();
  ctx.beginPath(); ctx.rect(-sw / 2, -h / 2 + b, sw, sh); ctx.clip();
  ctx.translate(-sw / 2, -h / 2 + b);
  const g = ctx.createLinearGradient(0, 0, 0, sh);
  g.addColorStop(0, '#2A0B6B'); g.addColorStop(0.45, '#B4237E'); g.addColorStop(0.75, '#FF7A3D'); g.addColorStop(1, '#FFC15A');
  ctx.fillStyle = g; ctx.fillRect(0, 0, sw, sh);
  // günəş
  const gx = sw * 0.62, gy = sh * 0.62;
  const gg = ctx.createRadialGradient(gx, gy, 0, gx, gy, sw * 0.32);
  gg.addColorStop(0, 'rgba(255,240,180,1)'); gg.addColorStop(0.25, 'rgba(255,200,90,0.9)'); gg.addColorStop(1, 'rgba(255,120,60,0)');
  ctx.fillStyle = gg; ctx.fillRect(0, 0, sw, sh);
  // dağlar
  const dag = (taban, amp, reng, faz) => {
    ctx.beginPath(); ctx.moveTo(0, sh);
    for (let x = 0; x <= sw; x += sw / 40) ctx.lineTo(x, taban - amp * (0.6 * Math.abs(Math.sin(x / sw * 5 + faz)) + 0.4 * Math.sin(x / sw * 11 + faz * 2)));
    ctx.lineTo(sw, sh); ctx.closePath(); ctx.fillStyle = reng; ctx.fill();
  };
  dag(sh * 0.78, sh * 0.22, '#5B1A6E', 0.8);
  dag(sh * 0.9, sh * 0.16, '#2B0E45', 2.1);
  // parıltı zolağı
  const p = ((t * 0.35) % 1.6) - 0.3;
  const pg = ctx.createLinearGradient(sw * (p - 0.15), 0, sw * (p + 0.15), sh * 0.3);
  pg.addColorStop(0, 'rgba(255,255,255,0)'); pg.addColorStop(0.5, 'rgba(255,255,255,0.22)'); pg.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = pg; ctx.fillRect(0, 0, sw, sh);
  ctx.restore();
  // alt çərçivədə ad
  ctx.fillStyle = '#C9CCD3'; ctx.font = `600 ${Math.round(w * 0.022)}px ${SRIFT_ADI}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('Hisense', 0, h / 2 - w * 0.011);
}

// ---------- konfeti və bəzəklər ----------
const KONFETI_RENG = [R.sari, R.ag, R.tund, '#FF7A98', '#3DDCFF'];
function konfeti(ctx, t, t0, x0, y0, { say = 80, toxum = 1, yay = Math.PI * 2, yon = -Math.PI / 2, guc = 1 } = {}) {
  const tau = t - t0;
  if (tau < 0 || tau > 3) return;
  const g = 1500, k = 1.6;
  for (let i = 0; i < say; i++) {
    const r = j => tesadufi(i * 7.3 + j + toxum * 100);
    const a = yon + (r(1) - 0.5) * yay, v = (700 + 1100 * r(2)) * guc;
    const vx = v * Math.cos(a), vy = v * Math.sin(a);
    const e = (1 - Math.exp(-k * tau)) / k;
    const x = x0 + vx * e + 40 * Math.sin(tau * (3 + 3 * r(5)) + i);
    const y = y0 + (vy + g / k) * e - g * tau / k;
    if (y > H + 50) continue;
    const olc = 12 + 14 * r(3);
    ctx.save(); ctx.translate(x, y); ctx.rotate(tau * (4 + 6 * r(4)) + i);
    ctx.globalAlpha *= sixis(3 - tau);
    ctx.fillStyle = KONFETI_RENG[i % KONFETI_RENG.length];
    if (i % 3 === 0) { ctx.beginPath(); ctx.arc(0, 0, olc * 0.45, 0, Math.PI * 2); ctx.fill(); }
    else ctx.fillRect(-olc / 2, -olc * 0.3 * Math.abs(Math.cos(tau * 8 + i)) - 1, olc, olc * 0.6 * Math.abs(Math.cos(tau * 8 + i)) + 2);
    ctx.restore();
  }
}

// komiks üslubunda "vurğu" xətləri
function vurgu(ctx, t, t0, x, y, s = 1) {
  const k = (t - t0) / 0.45;
  if (k < 0 || k > 1) return;
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.strokeStyle = R.sari; ctx.lineWidth = 12; ctx.lineCap = 'round'; ctx.globalAlpha *= 1 - k;
  [-2.4, -1.9, -1.35, -0.85].forEach(a => {
    const r0 = 40 + 60 * cixisYumsaq(k), r1 = r0 + 55;
    ctx.beginPath(); ctx.moveTo(r0 * Math.cos(a), r0 * Math.sin(a)); ctx.lineTo(r1 * Math.cos(a), r1 * Math.sin(a)); ctx.stroke();
  });
  ctx.restore();
}

function parlama(ctx, t, t0, x, y, en, hun) { // səpələnmiş parıltılar
  const tau = t - t0;
  if (tau < 0 || tau > 1.2) return;
  for (let i = 0; i < 7; i++) {
    const d = i * 0.08, k = (tau - d) / 0.5;
    if (k < 0 || k > 1) continue;
    const r = 18 + 22 * tesadufi(i + t0) ;
    ctx.save(); ctx.globalAlpha *= Math.sin(Math.PI * k);
    ulduz(ctx, x + (tesadufi(i * 3 + t0) - 0.5) * en, y + (tesadufi(i * 5 + t0) - 0.5) * hun, r * (0.5 + k), i % 2 ? R.sari : R.ag);
    ctx.restore();
  }
}

function logo(ctx, x, y, en, ag = true) {
  const img = ag ? SEKIL.logoAg : SEKIL.logo;
  if (!img) return;
  const h = en * img.height / img.width;
  ctx.drawImage(img, x - en / 2, y - h / 2, en, h);
}

// ---------- personajın hərəkəti ----------
const RITM = { bas: Z.yer, beat: 0.5 }; // fon musiqisinin vuruşları (rəqs bunlara uyğundur)

// [vaxt, x, ayaq altı y, ölçü, növbəti hissənin növü, tullanma hündürlüyü, fırlanma (salto)]
const YOL = [
  [0.00, 1360, 1560, 0.95, 'boyla'],
  [Z.tullan, 1005, 1560, 0.95, 'tullan', 260, 0],
  [Z.yer, 540, 1560, 0.95],
  [Z.sC, 540, 1560, 0.95, 'tullan', 280, 0],
  [Z.sC + 0.75, 290, 1890, 0.72],
  [Z.sD, 290, 1890, 0.72, 'tullan', 230, 0],
  [Z.sD + 0.65, 540, 1880, 0.85],
  [Z.sE - 0.3, 540, 1880, 0.85, 'qac'],
  [Z.sE + 0.45, 860, 1895, 0.66],
  [Z.sF - 0.2, 860, 1895, 0.66, 'tullan', 340, -1],
  [Z.sF + 0.6, 540, 1890, 0.82],
  [999, 540, 1890, 0.82],
];
// yerində tullanmalar: [başla, bitir, hündürlük, salto]
const YERINDE = [[Z.basladi - 0.05, Z.basladi + 0.5, 210, 1], [Z.gozleyirik - 0.05, Z.gozleyirik + 0.55, 200, 1]];

// bütün tullanmalar (sesler.js də istifadə edir)
const SICRAYIS = [
  ...YOL.flatMap((k, i) => k[4] === 'tullan' ? [{ a: k[0], b: YOL[i + 1][0], h: k[5], spin: k[6] }] : []),
  ...YERINDE.map(([a, b, h, spin]) => ({ a, b, h, spin })),
];
const ALQIS = [[Z.mohtesem - 0.1, Z.basladi - 0.05], [Z.elaveYox - 0.1, Z.sF - 0.3], [Z.sahib - 0.1, Z.son1 + 0.1]];
const QACIS = [[Z.sE - 0.3, Z.sE + 0.45], [Z.sF + 0.6, Z.gun2 - 0.2]]; // qaçış və "Tələsin"də yerində qaçış
const GOZ_QIRP = [2.0, 6.2, 11.0, 20.4, 27.2, 33.0, 37.6];
const GOZ_VUR = Z.gozleyirik + 1.0; // sonda göz vurur

function yolda(t) {
  let i = 0;
  while (i < YOL.length - 2 && t >= YOL[i + 1][0]) i++;
  const [t0, x0, a0, s0, nov] = YOL[i], [t1, x1, a1, s1] = YOL[i + 1];
  const k = sixis((t - t0) / (t1 - t0));
  const e = nov === 'boyla' ? cixisYumsaq(k) : nov === 'tullan' ? lerp(k, hamar(k), 0.4) : hamar(k);
  return { x: lerp(x0, x1, e), ay: lerp(a0, a1, e), s: lerp(s0, s1, e), nov: t < t1 && t > t0 ? nov : null };
}

// Qolların vəziyyəti: [başla, bitir, { up, wave, point, ang, clap }]
const QOL_SOL = [
  [Z.yer - 0.1, Z.sB + 0.1, { up: 1, wave: 1 }],
  [ALQIS[0][0], ALQIS[0][1], { clap: 1 }],
  [Z.basladi - 0.1, Z.sC, { up: 1, wave: 0.6 }],
  [Z.sD + 0.55, Z.sE - 0.3, { up: 1, wave: 1 }],
  [Z.sE + 0.5, Z.ayliq - 0.1, { point: 1, ang: -2.3 }],
  [Z.ayliq, Z.ay18LG + 0.3, { point: 1, ang: -2.85 }],
  [ALQIS[1][0], ALQIS[1][1], { clap: 1 }],
  [Z.sF + 0.5, Z.gun2 - 0.3, { up: 1, wave: 1.6 }],
  [Z.mehsullar + 0.1, Z.lent + 0.4, { point: 1, ang: -1.95 }],
  [ALQIS[2][0], ALQIS[2][1], { clap: 1 }],
  [Z.son1 + 0.2, 999, { up: 1, wave: 1 }],
];
const QOL_SAG = [
  [ALQIS[0][0], ALQIS[0][1], { clap: 1 }],
  [Z.basladi - 0.1, Z.sC, { up: 1, wave: 0.6 }],
  [Z.sC + 0.75, Z.sD, { point: 1, ang: -0.95 }],
  [Z.ay18LG + 0.4, Z.elaveYox, { up: 1, wave: 0.7 }],
  [ALQIS[1][0], ALQIS[1][1], { clap: 1 }],
  [Z.sF + 0.5, Z.gun2 - 0.3, { up: 1, wave: 1.6 }],
  [Z.gun2 - 0.1, Z.sayt - 0.2, { point: 1, ang: -1.3 }],
  [Z.sayt, Z.mehsullar + 0.4, { point: 1, ang: -1.5 }],
  [Z.lent - 0.2, Z.sahib, { point: 1, ang: -1.15 }],
  [ALQIS[2][0], ALQIS[2][1], { clap: 1 }],
  [Z.son1 + 0.2, 999, { up: 1, wave: 1 }],
];

function qolHali(siyahi, t) {
  const h = { up: 0, wave: 0, point: 0, ang: 0, clap: 0, aciq: 1, uz: 0 };
  let enCox = 0;
  for (const [a, b, v] of siyahi) {
    const w = pen(t, a, b, 0.28);
    if (w <= 0) continue;
    h.up = Math.max(h.up, (v.up || 0) * w);
    h.wave = Math.max(h.wave, (v.wave || 0) * w);
    h.clap = Math.max(h.clap, (v.clap || 0) * w);
    if (v.point && w > enCox) { enCox = w; h.point = w; h.ang = v.ang; }
  }
  // əllər musiqinin vuruşunda birləşir
  h.aciq = Math.abs(Math.sin(Math.PI * (t - RITM.bas) / RITM.beat));
  return h;
}

function poza(t) {
  const y = yolda(t), d = 1 / 120, y1 = yolda(t - d), y2 = yolda(t + d);
  const dx = y2.x - y1.x;
  const suret = Math.hypot(dx, y2.ay - y1.ay) / (2 * d) / y.s;
  const kadr = Math.round(t * FPS);
  const agiz = AGIZ && kadr < AGIZ.length ? AGIZ[kadr] : 0;

  // tullanma: əvvəl çömelir, havada uzanır (və fırlanır), düşəndə yaylanır
  let tull = 0, havada = -1, spin = 0, dusme = -1, hazir = 0;
  for (const j of SICRAYIS) {
    if (t > j.a && t < j.b) { havada = (t - j.a) / (j.b - j.a); tull = Math.sin(Math.PI * havada) * j.h; spin = j.spin * 2 * Math.PI * hamar(havada); }
    if (t >= j.b && t - j.b < 1.2) dusme = t - j.b;
    if (t > j.a - 0.16 && t <= j.a) hazir = Math.sin(0.5 * Math.PI * (t - j.a + 0.16) / 0.16);
  }
  const qac = y.nov === 'qac';
  const yerindeQac = tull ? 0 : pen(t, QACIS[1][0], QACIS[1][1], 0.15);
  const amp = tull ? 0 : Math.max(sixis(suret / 420), yerindeQac);
  const faza = 2 * Math.PI * (y.x / y.s) / (qac ? 260 : 180) + yerindeQac * 2 * Math.PI * 3.2 * t;

  // musiqiyə uyğun rəqs (yalnız dayananda)
  const sol = qolHali(QOL_SOL, t), sag = qolHali(QOL_SAG, t);
  const vurus = (t - RITM.bas) / RITM.beat;
  const dans = t < RITM.bas || tull ? 0 : (1 - amp) * (1 - 0.5 * Math.max(sol.point, sag.point));
  const dansSin = Math.sin(Math.PI * vurus);

  const bob = -(qac ? 22 : 12) * amp * Math.abs(Math.sin(faza)) - 14 * dans * Math.abs(dansSin) - 8 * agiz;
  let sixil = 0.13 * hazir + 0.035 * dans * Math.pow(1 - Math.abs(dansSin), 6);
  if (havada >= 0 && havada < 0.3) sixil -= 0.1 * (1 - havada / 0.3);
  if (dusme >= 0) sixil += 0.12 * Math.exp(-5 * dusme) * Math.cos(2 * Math.PI * 1.8 * dusme) * sixis(dusme / 0.05);

  const ayaq = [0, Math.PI].map((e, i) => ({
    dx: -(qac ? 60 : 45) * amp * Math.cos(faza + e),
    lift: (qac ? 40 : 28) * amp * Math.max(0, Math.sin(faza + e)) + (tull ? 34 : 0)
      + 16 * dans * Math.max(0, i ? -dansSin : dansSin),
  }));

  let donme = spin;
  if (t < Z.tullan) donme = -0.32;
  else if (t < Z.yer) donme = lerp(-0.32, 0, hamar((t - Z.tullan) / (Z.yer - Z.tullan)));

  // havada qollar sevinclə qalxır; danışarkən göstərən əl irəli-geri gedir
  const qolQalx = havada >= 0 ? Math.sin(Math.PI * havada) : 0;
  for (const h of [sol, sag]) {
    h.up = Math.max(h.up, 0.85 * qolQalx * (1 - h.point) * (1 - h.clap));
    h.uz = 40 * agiz;
  }

  let goz = 0;
  for (const g of GOZ_QIRP) { const q = t - g; if (q > 0 && q < 0.18) goz = Math.sin(Math.PI * q / 0.18); }
  goz = Math.max(goz, pen(t, GOZ_VUR, GOZ_VUR + 0.6, 0.1));

  return {
    t, x: y.x, y: y.ay - AYAQ_ALTI * y.s - tull, ayaqY: y.ay, s: y.s, tull,
    bob, sixil, ayaq, donme, goz, agiz,
    eyil: (qac ? 0.18 : 0.07) * amp * Math.sign(dx) + 0.05 * dans * dansSin + 0.03 * agiz * Math.sin(t * 5),
    yel: amp * Math.cos(faza) * (qac ? 1.4 : 1),
    sol, sag,
    ifade: {
      ulduz: Math.max(pen(t, Z.mohtesem, Z.sC - 0.1, 0.2), pen(t, Z.qiymet, Z.qiymet + 1.8, 0.2)),
      urek: pen(t, Z.arzu, Z.sE - 0.35, 0.25),
      ter: pen(t, Z.sF + 0.5, Z.gun2, 0.2),
    },
  };
}

// yerə düşəndə və qaçış başlayanda toz buludu
function toz(ctx, t, t0, x, y, s) {
  const k = (t - t0) / 0.6;
  if (k < 0 || k > 1) return;
  const ag = t > Z.sE && t < Z.sF;
  ctx.save();
  ctx.fillStyle = ag ? 'rgba(170,172,182,0.75)' : 'rgba(255,255,255,0.8)';
  ctx.globalAlpha = 1 - k;
  for (let i = 0; i < 6; i++) {
    const yon = i < 3 ? -1 : 1, j = i % 3;
    const px = x + yon * (90 + (90 + 50 * j) * cixisYumsaq(k)) * s;
    const py = y - (12 + 26 * j * k) * s;
    ctx.beginPath(); ctx.arc(px, py, (20 + 12 * j) * s * (0.6 + 0.8 * k), 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

function kolgeCek(ctx, p) {
  ctx.save();
  ctx.globalAlpha = 0.22 * (1 - sixis(p.tull / 400));
  ctx.fillStyle = '#000';
  ctx.beginPath(); ctx.ellipse(p.x, p.ayaqY - 4, 210 * p.s * (1 - p.tull / 600), 22 * p.s, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}


// ---------- səhnələr ----------
function sahneA(ctx, t) { // "Hey, diqqət, diqqət!"
  el(ctx, t, Z.hey, Z.sB, 280, 300, c => yazi(c, 'HEY!', 0, 0, { olcu: 140 }), { rot: -0.12 });
  el(ctx, t, Z.diqqet1, Z.sB, 560, 480, c => yazi(c, 'DİQQƏT,', 0, 0, { olcu: 150, reng: R.sari }), { rot: -0.05 });
  el(ctx, t, Z.diqqet2, Z.sB, 560, 660, c => yazi(c, 'DİQQƏT!', 0, 0, { olcu: 175 }), { rot: -0.05 });
}

function sahneB(ctx, t) { // "Möhtəşəm kampaniya başladı!"
  el(ctx, t, Z.mohtesem, Z.sC, 540, 320, c => yazi(c, 'MÖHTƏŞƏM', 0, 0, { olcu: 145, reng: R.sari }), { rot: -0.06 });
  el(ctx, t, Z.kampaniya, Z.sC, 540, 490, c => yazi(c, 'KAMPANİYA', 0, 0, { olcu: 145 }), { rot: -0.06 });
  el(ctx, t, Z.basladi, Z.sC, 540, 690, c => {
    hap(c, -330, -88, 660, 176, R.tund, { r: 30 });
    yazi(c, 'BAŞLADI!', 0, 4, { olcu: 135, reng: R.sari, kolge: false, kEn: 0 });
  }, { rot: -0.06, tip: 'mohur' });
}

function sahneC(ctx, t) { // tarix, 18 ay, faizsiz, komissiyasız
  const son = Z.sD;
  el(ctx, t, Z.faizsizSertler, son, 540, 245, c => {
    yazi(c, 'FAİZSİZ', 0, -62, { olcu: 128, kontur: R.goy, kEn: 26 });
    yazi(c, 'ŞƏRTLƏR', 0, 62, { olcu: 128, kontur: R.goy, kEn: 26 });
  }, { rot: -0.07 });
  el(ctx, t, Z.tarix, son, 540, 470, c => {
    hap(c, -300, -56, 600, 112, R.sari, { kontur: 7 });
    teqvimIkon(c, -225, 2, 1.05);
    yazi(c, '2 – 4 OKTYABR', 40, 4, { olcu: 62, reng: R.tund, kolge: false, kEn: 0 });
  });
  el(ctx, t, Z.saytda, son, 540, 580, c => yazi(c, 'Saytımızdakı məhsullar', 0, 0, { olcu: 50, italik: false, ceki: 800, ad: SRIFT_ADI, kEn: 0, kolge: false }), { tip: 'asagi' });
  el(ctx, t, Z.ay18, son, 540, 820, c => {
    yazi(c, '18', 70, 0, { olcu: 340, hiza: 'right', kEn: 30 });
    yazi(c, 'AY', 95, 45, { olcu: 170, hiza: 'left', reng: R.sari, kEn: 22 });
  }, { tip: 'mohur', rot: -0.05 });
  el(ctx, t, Z.faizsiz, son, 540, 1080, c => {
    hap(c, -310, -60, 620, 120, R.ag, { kontur: 8, kolge: true });
    c.beginPath(); c.arc(-235, 0, 46, 0, Math.PI * 2); c.fillStyle = R.qirmizi; c.fill();
    yazi(c, '0%', -235, 2, { olcu: 40, kolge: false, kEn: 0 });
    yazi(c, 'FAİZSİZ', 40, 4, { olcu: 76, reng: R.qirmizi, kolge: false, kEn: 0 });
  }, { tip: 'mohur', rot: 0.03 });
  el(ctx, t, Z.komissiya, son, 540, 1215, c => {
    hap(c, -360, -60, 720, 120, R.ag, { kontur: 8, kolge: true });
    c.beginPath(); c.arc(-285, 0, 46, 0, Math.PI * 2); c.fillStyle = R.qirmizi; c.fill();
    yazi(c, '0₼', -285, 2, { olcu: 40, kolge: false, kEn: 0 });
    yazi(c, 'KOMİSSİYASIZ', 40, 4, { olcu: 74, reng: R.qirmizi, kolge: false, kEn: 0 });
  }, { tip: 'mohur', rot: -0.03 });
  el(ctx, t, Z.taksit, son, 640, 1345, c => yazi(c, 'taksitlə əldə edin!', 0, 0, { olcu: 64, reng: R.sari, kEn: 12 }), { tip: 'asagi' });
}

function sahneD(ctx, t) { // "Arzularınızı təxirə salmayın!"
  if (t > Z.sD && t < Z.sE + 0.5) {
    for (let i = 0; i < 16; i++) {
      const bas = Z.sD + i * 0.17, tau = t - bas;
      if (tau < 0) continue;
      const x = 80 + 920 * tesadufi(i * 3.1) + 40 * Math.sin(tau * 2 + i);
      const y = 1950 - tau * (380 + 200 * tesadufi(i * 5.7));
      ctx.save(); ctx.globalAlpha = sixis(tau * 3) * sixis((Z.sE + 0.4 - t) * 2) * 0.9;
      urek(ctx, x, y, 0.7 + 0.8 * tesadufi(i * 9.1), i % 3 ? 'rgba(255,255,255,0.85)' : R.sari);
      ctx.restore();
    }
  }
  el(ctx, t, Z.arzu, Z.sE - 0.3, 540, 400, c => yazi(c, 'ARZULARINIZI', 0, 0, { olcu: 125 }), { rot: -0.06 });
  el(ctx, t, Z.texire, Z.sE - 0.3, 540, 575, c => yazi(c, 'TƏXİRƏ', 0, 0, { olcu: 165, reng: R.sari }), { rot: -0.06 });
  el(ctx, t, Z.salmayin, Z.sE - 0.3, 540, 750, c => yazi(c, 'SALMAYIN!', 0, 0, { olcu: 165 }), { rot: -0.06 });
}

function ozellik(ctx, ikon, metn, t) {
  hap(ctx, 0, -40, 620, 80, R.ag, { kolge: true });
  ctx.beginPath(); ctx.arc(40, 0, 32, 0, Math.PI * 2); ctx.fillStyle = R.qirmizi; ctx.fill();
  ctx.save(); ctx.translate(40, 0); ikon(ctx, t); ctx.restore();
  ctx.fillStyle = R.tund; ctx.font = srift(42, { italik: false, ceki: 800, ad: SRIFT_ADI });
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(metn, 90, 2);
}

function sahneE(ctx, t) { // LG paltaryuyan maşını
  const son = Z.sF - 0.3;
  el(ctx, t, Z.lgBasliq, son, 540, 165, c => {
    yazi(c, 'LG paltaryuyan maşını', 0, 0, { olcu: 78, reng: R.tund, kolge: false, kEn: 0 });
    c.strokeStyle = R.qirmizi; c.lineWidth = 12; c.lineCap = 'round';
    c.beginPath(); c.moveTo(-300, 62); c.quadraticCurveTo(0, 42, 300, 62); c.stroke();
  }, { tip: 'asagi' });

  // şəkil kartı: lg-1 → lg-3 (Wi-Fi zamanı panel) → lg-2
  el(ctx, t, Z.sE + 0.1, son, 540, 660, c => {
    c.save(); c.shadowColor = 'rgba(0,0,0,0.18)'; c.shadowBlur = 50; c.shadowOffsetY = 20;
    c.beginPath(); c.roundRect(-360, -360, 720, 720, 44); c.fillStyle = R.ag; c.fill(); c.restore();
    c.save(); c.beginPath(); c.roundRect(-360, -360, 720, 720, 44); c.clip();
    const sekiller = [['lg1', -1, Z.ozellik3 + 0.2], ['lg3', Z.ozellik3 + 0.2, Z.ayliq + 0.3], ['lg2', Z.ayliq + 0.3, 999]];
    for (const [ad, a, b] of sekiller) {
      const w = sixis((t - a) / 0.35) * (1 - sixis((t - b) / 0.35));
      if (w <= 0 || !SEKIL[ad]) continue;
      const z = 1 + 0.06 * sixis((t - a) / 6);
      c.globalAlpha = w; c.drawImage(SEKIL[ad], -340 * z, -340 * z, 680 * z, 680 * z);
    }
    c.restore();
  }, { tip: 'pop', giris: 0.5 });

  el(ctx, t, Z.ay18LG, son, 845, 380, c => {
    ulduzNisan(c, 118, t);
    yazi(c, '18 AY', 0, -26, { olcu: 50, kolge: false, kEn: 0 });
    yazi(c, '0%', 0, 30, { olcu: 62, reng: R.sari, kolge: false, kEn: 0 });
  }, { tip: 'mohur', rot: 0.12 });

  const xc = 50;
  el(ctx, t, Z.ozellik1, son, xc, 1110, c => ozellik(c, (k) => kqIkon(k, 1), '7 kq tutum', t), { tip: 'sol' });
  el(ctx, t, Z.ozellik2, son, xc, 1205, c => ozellik(c, (k, tt) => buxarIkon(k, 1, tt), 'Buxarla yuma', t), { tip: 'sol' });
  el(ctx, t, Z.ozellik3, son, xc, 1300, c => ozellik(c, (k) => wifiIkon(k, 1), 'Telefondan Wi-Fi idarə', t), { tip: 'sol' });

  el(ctx, t, Z.ayliq, son, 60, 1420, c => {
    c.fillStyle = R.tund; c.font = srift(46, { italik: false, ceki: 800, ad: SRIFT_ADI });
    c.textAlign = 'left'; c.textBaseline = 'middle'; c.fillText('Aylıq cəmi', 0, 0);
  }, { tip: 'sol' });
  el(ctx, t, Z.qiymet, son, 60, 1540, c => {
    const en = yazi(c, QIYMET.lg, 0, 0, { olcu: 150, reng: R.qirmizi, hiza: 'left', kEn: 14 });
    yazi(c, '₼', en + 18, 8, { olcu: 92, reng: R.tund, hiza: 'left', kolge: false, kEn: 0 });
    c.fillStyle = R.boz; c.font = srift(40, { italik: false, ceki: 700, ad: SRIFT_ADI }); c.textAlign = 'left';
    c.fillText('/ ay', en + 22, 80);
  }, { tip: 'mohur' });
  parlama(ctx, t, Z.qiymet, 300, 1540, 500, 200);

  el(ctx, t, Z.ay18LG, son, 60, 1690, c => {
    const en = enOlc(c, '18 AY FAİZSİZ', 52) + 80;
    hap(c, 0, -42, en, 84, R.tund);
    yazi(c, '18 AY FAİZSİZ', 40, 2, { olcu: 52, reng: R.sari, hiza: 'left', kolge: false, kEn: 0 });
  }, { tip: 'sol' });
  el(ctx, t, Z.elaveYox, son, 60, 1795, c => {
    const en = enOlc(c, 'Əlavə ödəniş YOXDUR!', 48) + 80;
    hap(c, 0, -42, en, 84, R.sari, { kontur: 6 });
    yazi(c, 'Əlavə ödəniş YOXDUR!', 40, 2, { olcu: 48, reng: R.tund, hiza: 'left', kolge: false, kEn: 0 });
  }, { tip: 'mohur' });
}

function gunKart(ctx, gun) {
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.25)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 14;
  ctx.beginPath(); ctx.roundRect(-125, -140, 250, 280, 30); ctx.fillStyle = R.ag; ctx.fill(); ctx.restore();
  ctx.beginPath(); ctx.roundRect(-125, -140, 250, 280, 30); ctx.lineWidth = 8; ctx.strokeStyle = R.tund; ctx.stroke();
  ctx.save(); ctx.beginPath(); ctx.roundRect(-125, -140, 250, 280, 30); ctx.clip();
  ctx.fillStyle = R.tund; ctx.fillRect(-125, -140, 250, 74); ctx.restore();
  yazi(ctx, 'OKT', 0, -102, { olcu: 46, reng: R.sari, kolge: false, kEn: 0 });
  yazi(ctx, String(gun), 0, 40, { olcu: 150, reng: R.qirmizi, kolge: false, kEn: 0 });
}

function mehsulKart(ctx, t, nov) {
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.28)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 16;
  ctx.beginPath(); ctx.roundRect(-235, -330, 470, 660, 36); ctx.fillStyle = R.ag; ctx.fill(); ctx.restore();
  ctx.beginPath(); ctx.roundRect(-235, -330, 470, 660, 36); ctx.lineWidth = 7; ctx.strokeStyle = R.tund; ctx.stroke();
  if (nov === 'lg') { if (SEKIL.lg1) ctx.drawImage(SEKIL.lg1, -185, -315, 370, 370); }
  else { ctx.save(); ctx.translate(0, -140); televizor(ctx, 420, t); ctx.restore(); }
  const ad = nov === 'lg' ? 'LG paltaryuyan' : 'Hisense 55" MiniLED';
  const xus = nov === 'lg' ? '7 kq · Buxar · Wi-Fi' : '4K · Dolby Atmos';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = R.tund; ctx.font = srift(38, { italik: false, ceki: 800, ad: SRIFT_ADI }); ctx.fillText(ad, 0, 105, 430);
  ctx.fillStyle = R.boz; ctx.font = `600 30px ${SRIFT_ADI}`; ctx.fillText(xus, 0, 152, 430);
  const q = nov === 'lg' ? QIYMET.lg : QIYMET.tv;
  ctx.font = srift(30, { italik: false, ceki: 700, ad: SRIFT_ADI }); ctx.fillStyle = R.boz; ctx.fillText('aylıq', 0, 205);
  const en = enOlc(ctx, q, 80);
  yazi(ctx, q, -30, 268, { olcu: 80, reng: R.qirmizi, kEn: 0, kolge: false });
  yazi(ctx, '₼', -30 + en / 2 + 34, 272, { olcu: 52, reng: R.tund, kEn: 0, kolge: false });
  // künc nişanı
  ctx.save(); ctx.translate(180, -290); ctx.rotate(0.2);
  ulduzNisan(ctx, 62, t);
  yazi(ctx, '0%', 0, 2, { olcu: 40, kolge: false, kEn: 0 });
  ctx.restore();
}

function sahneF(ctx, t) { // Tələsin + sayt + məhsullar + son
  el(ctx, t, Z.telesin, Z.sayt - 0.3, 540, 290, c => {
    c.save(); c.translate(6 * Math.sin(t * 50) * pen(t, Z.telesin, Z.telesin + 0.6, 0.1), 0);
    yazi(c, 'TƏLƏSİN!', 75, 0, { olcu: 155, reng: R.sari, kEn: 24, maxEn: 720 });
    c.translate(-395, -10); saat(c, 0.9, t);
    c.restore();
  }, { rot: -0.05 });
  el(ctx, t, Z.ucGun, Z.sayt - 0.3, 540, 460, c => yazi(c, 'Kampaniya cəmi 3 gün!', 0, 0, { olcu: 74 }), { tip: 'asagi' });
  [[Z.gun2, 2, 200], [Z.gun3, 3, 540], [Z.gun4, 4, 880]].forEach(([at, gun, x], i) =>
    el(ctx, t, at, Z.sayt - 0.3, x, 720, c => gunKart(c, gun), { rot: (i - 1) * 0.06 }));

  // sayt ünvanı: əvvəl ortada, məhsullar gələndə yuxarı qalxır
  const yuxari = cixisYumsaq((t - Z.mehsullar) / 0.5);
  el(ctx, t, Z.sayt, Z.mehsullar, 540, 340, c => yazi(c, 'İndi saytımıza keçin!', 0, 0, { olcu: 82 }), { tip: 'asagi' });
  el(ctx, t, Z.sayt + 0.15, Z.son1, 540, lerp(560, 240, sixis(yuxari)), c => {
    const sc = lerp(1, 0.8, sixis(yuxari)), basma = 1 - 0.07 * Math.sin(Math.PI * sixis((t - Z.klik) / 0.2));
    c.scale(sc * basma, sc * basma);
    hap(c, -400, -75, 800, 150, R.ag, { kontur: 9, kolge: true });
    c.beginPath(); c.arc(-320, 0, 50, 0, Math.PI * 2); c.fillStyle = R.qirmizi; c.fill();
    c.save(); c.translate(-320, 0); dunyaIkon(c, 1.15); c.restore();
    yazi(c, 'kontakt.az', 50, 0, { olcu: 92, reng: R.tund, kEn: 0, kolge: false, italik: false });
    // klik dalğası
    const kd = (t - Z.klik) / 0.5;
    if (kd > 0 && kd < 1) {
      c.beginPath(); c.arc(260, 20, 30 + 120 * kd, 0, Math.PI * 2);
      c.lineWidth = 10 * (1 - kd); c.strokeStyle = R.qirmizi; c.stroke();
    }
    // siçan göstəricisi
    const kk = sixis((t - Z.sayt - 0.2) / 0.6), kx = lerp(560, 260, cixisYumsaq(kk)), ky = lerp(320, 20, cixisYumsaq(kk));
    if (t < Z.mehsullar) kursor(c, kx, ky, 1.2);
  }, { tip: 'pop' });

  el(ctx, t, Z.mehsullar, Z.son1, 290, 770, c => mehsulKart(c, t, 'lg'), { tip: 'sol', giris: 0.55, rot: -0.03 });
  el(ctx, t, Z.mehsullar + 0.25, Z.son1, 790, 770, c => mehsulKart(c, t, 'tv'), { tip: 'sag', giris: 0.55, rot: 0.03 });
  parlama(ctx, t, Z.sahib, 540, 770, 900, 600);

  el(ctx, t, Z.lent, Z.son1, 540, 1205, c => {
    c.fillStyle = R.tund; c.fillRect(-640, -62, 1280, 124);
    c.fillStyle = R.sari; c.fillRect(-640, -62, 1280, 8); c.fillRect(-640, 54, 1280, 8);
    yazi(c, '18 AYA FAİZSİZ • KOMİSSİYASIZ', 0, 4, { olcu: 62, reng: R.sari, kolge: false, kEn: 0 });
  }, { tip: 'sol', rot: -0.04 });

  // son kadr
  el(ctx, t, Z.son1 + 0.2, 999, 540, 400, c => logo(c, 0, 0, 760, true), { giris: 0.5 });
  el(ctx, t, Z.gozleyirik, 999, 540, 640, c => yazi(c, 'Sizi gözləyirik!', 0, 0, { olcu: 120, reng: R.sari, kEn: 20 }), { rot: -0.05 });
  el(ctx, t, Z.gozleyirik + 0.4, 999, 540, 820, c => {
    hap(c, -360, -52, 720, 104, R.ag, { kontur: 7, kolge: true });
    yazi(c, '2 – 4 oktyabr · 18 ay 0%', 0, 3, { olcu: 50, reng: R.qirmizi, kEn: 0, kolge: false });
  }, { tip: 'asagi' });
  el(ctx, t, Z.gozleyirik + 0.7, 999, 540, 960, c => yazi(c, 'kontakt.az', 0, 0, { olcu: 80, italik: false, kEn: 14 }), { tip: 'asagi' });
}

// ---------- bir kadr ----------
function kadrCek(ctx, t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  fon(ctx, t);

  // A və B səhnələrində altda ağ loqo
  el(ctx, t, 0.3, Z.sC - 0.2, 540, 1770, c => logo(c, 0, 0, 380, true), { tip: 'asagi' });

  if (t < Z.sC + 0.3) { sahneA(ctx, t); sahneB(ctx, t); }
  if (t > Z.sC - 0.1 && t < Z.sE) sahneC(ctx, t);
  if (t > Z.sD - 0.1 && t < Z.sF) sahneD(ctx, t);
  if (t > Z.sE - 0.3 && t < Z.sF + 0.5) sahneE(ctx, t);
  if (t > Z.sF - 0.3) sahneF(ctx, t);

  const p = poza(t);
  kolgeCek(ctx, p);
  for (const j of SICRAYIS) { const y = yolda(j.b); toz(ctx, t, j.b, y.x, y.ay, y.s); }
  for (const [a] of QACIS) { const y = yolda(a + 0.05); toz(ctx, t, a, y.x, y.ay, y.s); }
  personajCek(ctx, p);

  // ön plan: vurğular, konfeti
  const bas = { x: p.x - 150 * p.s, y: p.y - 200 * p.s };
  vurgu(ctx, t, Z.diqqet1, bas.x, bas.y, 1.1);
  vurgu(ctx, t, Z.diqqet2, p.x + 150 * p.s, bas.y, 1.1);
  vurgu(ctx, t, Z.telesin, bas.x, bas.y, 1);
  konfeti(ctx, t, Z.basladi, 540, 720, { say: 90, toxum: 1, guc: 1.1 });
  konfeti(ctx, t, Z.basladi + 0.05, 0, 1900, { say: 50, toxum: 2, yon: -1.1, yay: 0.6, guc: 1.6 });
  konfeti(ctx, t, Z.basladi + 0.05, 1080, 1900, { say: 50, toxum: 3, yon: -2.04, yay: 0.6, guc: 1.6 });
  konfeti(ctx, t, Z.gozleyirik, 0, 1900, { say: 60, toxum: 4, yon: -1.15, yay: 0.6, guc: 1.7 });
  konfeti(ctx, t, Z.gozleyirik, 1080, 1900, { say: 60, toxum: 5, yon: -1.99, yay: 0.6, guc: 1.7 });
}

// ---------- yükləmə ----------
function sekilYukle(ad, src) {
  return new Promise((ok, xeta) => {
    const img = new Image();
    img.onload = () => { SEKIL[ad] = img; ok(img); };
    img.onerror = () => xeta(new Error('Şəkil yüklənmədi: ' + src));
    img.src = src;
  });
}

async function hazirliq() {
  await Promise.all([
    sekilYukle('lg1', 'sekiller/lg-1.png'),
    sekilYukle('lg2', 'sekiller/lg-2.png'),
    sekilYukle('lg3', 'sekiller/lg-3.png'),
    sekilYukle('logo', 'sekiller/logo.svg'),
  ]);
  // loqonun ağ variantı (qırmızı fon üçün)
  const L = SEKIL.logo, c = document.createElement('canvas');
  c.width = 1310; c.height = Math.round(1310 * L.height / L.width);
  const x = c.getContext('2d');
  x.drawImage(L, 0, 0, c.width, c.height);
  x.globalCompositeOperation = 'source-in'; x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height);
  SEKIL.logoAg = c;
  const c2 = document.createElement('canvas'); c2.width = c.width; c2.height = c.height;
  c2.getContext('2d').drawImage(L, 0, 0, c.width, c.height);
  SEKIL.logo = c2;
  if (document.fonts) await document.fonts.ready;
}
