// Səs: səsləndirmə (ses.mp3) + kodla sintez edilən səs effektləri və yüngül fon musiqisi.
// Həm önizləmədə (AudioContext), həm MP4 üçün (OfflineAudioContext) eyni funksiya işləyir.

// ctx — audio konteksti, t0 — videonun 0-cı saniyəsinə uyğun ctx vaxtı,
// basla — videonun hansı saniyəsindən oynadılır (önizləmədə irəli çəkəndə)
function sesQur(ctx, sesBuf, t0, basla = 0) {
  const T = at => t0 + at;
  const kecib = at => at < basla - 0.02;

  const komp = ctx.createDynamicsCompressor();
  komp.threshold.value = -10; komp.ratio.value = 6; komp.attack.value = 0.003; komp.release.value = 0.15;
  komp.connect(ctx.destination);

  const mix = ctx.createGain(); mix.gain.value = 0.9; mix.connect(komp);
  const efekt = ctx.createGain(); efekt.gain.value = 0.42; efekt.connect(mix);
  const musiqi = ctx.createGain(); musiqi.connect(mix);
  musiqi.gain.setValueAtTime(0.11, T(0));
  musiqi.gain.setValueAtTime(0.11, T(VAXT.son - 1.6));
  musiqi.gain.linearRampToValueAtTime(0.0001, T(VAXT.son - 0.1));

  // Səsləndirmə
  if (sesBuf) {
    const src = ctx.createBufferSource(), g = ctx.createGain();
    src.buffer = sesBuf; g.gain.value = 1.0;
    src.connect(g).connect(mix);
    const icinde = Math.max(0, basla - VAXT.ofset);
    src.start(T(Math.max(VAXT.ofset, basla)), icinde);
  }

  // həmişə eyni olan ağ küy
  const kuy = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const d = kuy.getChannelData(0);
  for (let i = 0, s = 7; i < d.length; i++) { s = (s * 16807) % 2147483647; d[i] = s / 1073741823.5 - 1; }

  function zerf(g, at, vol, hucum, sonme) {
    g.gain.setValueAtTime(0.0001, T(at));
    g.gain.exponentialRampToValueAtTime(vol, T(at) + hucum);
    g.gain.exponentialRampToValueAtTime(0.0001, T(at) + hucum + sonme);
  }

  function ton(tip, tezlik, at, uz, vol, { hedef = efekt, hucum = 0.004, filtr = 0, sonTezlik = 0 } = {}) {
    if (kecib(at)) return;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = tip; o.frequency.setValueAtTime(tezlik, T(at));
    if (sonTezlik) o.frequency.exponentialRampToValueAtTime(sonTezlik, T(at) + hucum + uz);
    zerf(g, at, vol, hucum, uz);
    if (filtr) { const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = filtr; o.connect(f).connect(g); }
    else o.connect(g);
    g.connect(hedef);
    o.start(T(at)); o.stop(T(at) + hucum + uz + 0.05);
  }

  function kuySes(at, uz, vol, tip, tezlik, { Q = 1, hedef = efekt, hucum = 0.002, sonTezlik = 0 } = {}) {
    if (kecib(at)) return;
    const src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    src.buffer = kuy; src.loop = true;
    f.type = tip; f.Q.value = Q; f.frequency.setValueAtTime(tezlik, T(at));
    if (sonTezlik) f.frequency.exponentialRampToValueAtTime(sonTezlik, T(at) + hucum + uz);
    zerf(g, at, vol, hucum, uz);
    src.connect(f).connect(g).connect(hedef);
    src.start(T(at), (at * 0.37) % 1.5); src.stop(T(at) + hucum + uz + 0.05);
  }

  // ---- Səs effektləri ----
  const SFX = {
    vus(at, uz = 0.45, vol = 0.5) {           // "vıııJ" keçid
      kuySes(at, uz, vol, 'bandpass', 500, { Q: 1.2, hucum: uz * 0.55, sonTezlik: 4200 });
    },
    vusAsagi(at, uz = 0.4, vol = 0.45) {
      kuySes(at, uz, vol, 'bandpass', 3500, { Q: 1.2, hucum: uz * 0.4, sonTezlik: 400 });
    },
    pop(at, tezlik = 700, vol = 0.55) {        // balon partlaması kimi qısa "pop"
      ton('sine', tezlik, at, 0.09, vol, { hucum: 0.002, sonTezlik: tezlik * 0.4 });
      kuySes(at, 0.03, vol * 0.4, 'highpass', 2500);
    },
    boing(at) {                                // tullanma
      ton('sine', 180, at, 0.32, 0.45, { hucum: 0.01, sonTezlik: 620 });
      ton('triangle', 360, at, 0.28, 0.12, { hucum: 0.01, sonTezlik: 1240 });
    },
    yereDusme(at, vol = 0.8) {                 // yerə düşmə / möhür "dup"
      ton('sine', 140, at, 0.22, vol, { hucum: 0.002, sonTezlik: 45 });
      kuySes(at, 0.08, vol * 0.35, 'lowpass', 900);
    },
    mohur(at) {                                // möhür vurulur
      SFX.yereDusme(at, 0.7);
      kuySes(at + 0.005, 0.05, 0.3, 'bandpass', 1800, { Q: 2 });
    },
    zeng(at, tezlik = 1320, vol = 0.35) {      // metal zəng ("ding")
      [[1, 1], [2.76, 0.4], [5.4, 0.18], [8.9, 0.08]].forEach(([k, v]) =>
        ton('sine', tezlik * k, at, 1.1 / Math.sqrt(k), vol * v, { hucum: 0.002 }));
    },
    parilti(at, vol = 0.22) {                  // "parıldama" — sürətli yüksələn notlar
      [2093, 2637, 3136, 4186, 5274].forEach((f, i) => ton('sine', f, at + i * 0.045, 0.35, vol, { hucum: 0.002 }));
    },
    konfeti(at) {                              // partiya fişəngi + xışıltı
      kuySes(at, 0.12, 0.9, 'bandpass', 1200, { Q: 0.7 });
      ton('sine', 220, at, 0.12, 0.5, { hucum: 0.002, sonTezlik: 60 });
      for (let i = 0; i < 26; i++) {
        const r = Math.abs(Math.sin(i * 91.7));
        kuySes(at + 0.08 + i * 0.028 + r * 0.02, 0.02, 0.1 + 0.12 * r, 'highpass', 5000 + 3000 * r);
      }
      SFX.parilti(at + 0.1, 0.12);
    },
    kassa(at) {                                // kassa aparatı "ka-çinq"
      kuySes(at, 0.07, 0.6, 'bandpass', 2500, { Q: 3 });               // "ka"
      ton('square', 180, at, 0.05, 0.15, { filtr: 1500 });
      SFX.zeng(at + 0.09, 2350, 0.42);                                   // "çinq"
      SFX.zeng(at + 0.09, 3520, 0.22);
      for (let i = 0; i < 6; i++) kuySes(at + 0.12 + i * 0.035, 0.03, 0.12, 'highpass', 7000); // sikkələr
    },
    tik(at, tezlik = 1900) {                   // saat tıqqıltısı
      ton('sine', tezlik, at, 0.03, 0.45, { hucum: 0.001 });
      kuySes(at, 0.012, 0.25, 'bandpass', 3000, { Q: 4 });
    },
    zengli(at, uz = 0.6) {                     // zəngli saat
      for (let i = 0; i * 0.045 < uz; i++) {
        ton('square', 2400, at + i * 0.045, 0.035, 0.07, { hucum: 0.001, filtr: 5000 });
        ton('sine', 1850, at + i * 0.045, 0.04, 0.18, { hucum: 0.001 });
      }
    },
    alqis(at) {                                // əl çalma
      kuySes(at, 0.09, 0.55, 'bandpass', 1300, { Q: 1.1 });
      kuySes(at + 0.008, 0.06, 0.3, 'bandpass', 2400, { Q: 1.5 });
    },
    addim(at) {                                // qaçış addımı
      ton('sine', 210, at, 0.05, 0.3, { hucum: 0.002, sonTezlik: 90 });
      kuySes(at, 0.03, 0.12, 'lowpass', 1200);
    },
    klik(at) {                                 // siçan klik
      kuySes(at, 0.012, 0.6, 'highpass', 3500);
      kuySes(at + 0.07, 0.01, 0.45, 'highpass', 3000);
      ton('sine', 1200, at, 0.02, 0.2, { hucum: 0.001 });
    },
  };

  // ---- Effektlərin zaman cədvəli (video saniyəsi) ----
  const Z = VAXT;
  SFX.vus(0.0, 0.35, 0.35);
  // personajın hərəkətləri: tullanma, salto, düşmə, əl çalma, qaçış addımları
  for (const j of SICRAYIS) {
    SFX.boing(j.a);
    if (j.spin) SFX.vus(j.a + 0.05, (j.b - j.a) * 0.8, 0.3);
    SFX.yereDusme(j.b, 0.6);
  }
  for (const [a, b] of ALQIS) {
    for (let n = Math.ceil((a + 0.2 - RITM.bas) / RITM.beat); RITM.bas + n * RITM.beat < b - 0.15; n++) SFX.alqis(RITM.bas + n * RITM.beat);
  }
  for (const [a, b] of QACIS) for (let at = a + 0.1; at < b - 0.1; at += 0.156) SFX.addim(at);
  SFX.zeng(Z.diqqet1, 1568, 0.22); SFX.zeng(Z.diqqet2, 2093, 0.24);
  SFX.vus(Z.sB - 0.25, 0.3, 0.3);
  SFX.pop(Z.mohtesem, 600); SFX.pop(Z.kampaniya, 750); SFX.konfeti(Z.basladi);
  SFX.vus(Z.sC - 0.3, 0.35, 0.35);
  SFX.pop(Z.faizsizSertler, 650); SFX.pop(Z.tarix, 900);
  SFX.pop(Z.saytda, 800, 0.35);
  kuySes(Z.ay18 - 0.6, 0.6, 0.18, 'bandpass', 600, { Q: 1, hucum: 0.58, sonTezlik: 3500 }); // qısa yüksəliş
  SFX.mohur(Z.ay18); SFX.mohur(Z.faizsiz); SFX.mohur(Z.komissiya); SFX.pop(Z.taksit, 900, 0.4);
  SFX.vus(Z.sD - 0.3, 0.35, 0.3);
  SFX.pop(Z.arzu, 700); SFX.pop(Z.texire, 850); SFX.parilti(Z.salmayin);
  SFX.vus(Z.sE - 0.25, 0.5, 0.55);
  SFX.pop(Z.lgBasliq, 700);
  SFX.pop(Z.ozellik1, 880, 0.45); SFX.pop(Z.ozellik2, 990, 0.45); SFX.pop(Z.ozellik3, 1100, 0.45);
  kuySes(Z.ayliq - 0.2, 0.9, 0.16, 'bandpass', 500, { Q: 1, hucum: 0.85, sonTezlik: 3000 });
  SFX.kassa(Z.qiymet);
  SFX.mohur(Z.ay18LG); SFX.parilti(Z.elaveYox);
  SFX.vus(Z.sF - 0.25, 0.5, 0.55);
  SFX.zengli(Z.telesin, 0.55);
  for (let at = Z.telesin + 0.7, i = 0; at < Z.gun2 - 0.15; at += 0.5, i++) SFX.tik(at, i % 2 ? 1500 : 1900);
  SFX.pop(Z.gun2, 700); SFX.pop(Z.gun3, 850); SFX.pop(Z.gun4, 1000);
  SFX.vusAsagi(Z.sayt - 0.25, 0.3, 0.3);
  SFX.pop(Z.sayt, 650);
  SFX.klik(Z.klik);
  SFX.vus(Z.mehsullar - 0.15, 0.4, 0.4);
  SFX.mohur(Z.lent);
  SFX.parilti(Z.sahib);
  SFX.vus(Z.son1 - 0.3, 0.35, 0.3);
  SFX.konfeti(Z.gozleyirik);
  SFX.zeng(Z.son - 1.6, 1568, 0.3); SFX.zeng(Z.son - 1.6, 1976, 0.22); SFX.zeng(Z.son - 1.6, 2349, 0.18);

  // ---- Fon musiqisi: 120 BPM, C – G – Am – F ----
  const BEAT = 0.5, BAS = Z.yer;
  const akkordlar = [[130.81, [261.63, 329.63, 392.0]], [98.0, [246.94, 293.66, 392.0]],
                     [110.0, [261.63, 329.63, 440.0]], [87.31, [261.63, 349.23, 440.0]]];
  const kick = at => { if (kecib(at)) return; ton('sine', 130, at, 0.22, 0.9, { hedef: musiqi, hucum: 0.002, sonTezlik: 42 }); };
  const hat = at => kuySes(at, 0.04, 0.22, 'highpass', 7500, { hedef: musiqi });
  const clap = at => kuySes(at, 0.14, 0.5, 'bandpass', 1400, { Q: 0.8, hedef: musiqi });
  for (let n = 0, at = BAS; at < Z.son - 1.7; n++, at = BAS + n * BEAT) {
    const [bas, akkord] = akkordlar[Math.floor(n / 4) % 4];
    kick(at);
    if (n % 2 === 1) clap(at);
    hat(at + BEAT / 2);
    ton('sawtooth', bas, at, BEAT * 0.8, 0.32, { hedef: musiqi, filtr: 420, hucum: 0.01 });
    if (n % 2 === 0) akkord.forEach(f => ton('square', f, at + BEAT / 2, 0.16, 0.05, { hedef: musiqi, filtr: 2200 }));
  }
  // son akkord
  [[130.81, 0.3], [261.63, 0.06], [329.63, 0.06], [392.0, 0.06], [523.25, 0.05]].forEach(([f, v]) =>
    ton(f < 200 ? 'sawtooth' : 'square', f, Z.son - 1.6, 1.4, v, { hedef: musiqi, filtr: 1800, hucum: 0.01 }));
  kick(Z.son - 1.6);
}

// AudioBuffer → 16-bit WAV (MP4 üçün serverə göndərilir)
function wavYarat(buf) {
  const kanal = buf.numberOfChannels, n = buf.length, sr = buf.sampleRate;
  const out = new DataView(new ArrayBuffer(44 + n * kanal * 2));
  const yaz = (o, s) => { for (let i = 0; i < s.length; i++) out.setUint8(o + i, s.charCodeAt(i)); };
  yaz(0, 'RIFF'); out.setUint32(4, 36 + n * kanal * 2, true); yaz(8, 'WAVE');
  yaz(12, 'fmt '); out.setUint32(16, 16, true); out.setUint16(20, 1, true); out.setUint16(22, kanal, true);
  out.setUint32(24, sr, true); out.setUint32(28, sr * kanal * 2, true); out.setUint16(32, kanal * 2, true); out.setUint16(34, 16, true);
  yaz(36, 'data'); out.setUint32(40, n * kanal * 2, true);
  const kanallar = Array.from({ length: kanal }, (_, k) => buf.getChannelData(k));
  for (let i = 0, o = 44; i < n; i++) for (let k = 0; k < kanal; k++, o += 2) {
    const v = Math.max(-1, Math.min(1, kanallar[k][i]));
    out.setInt16(o, v < 0 ? v * 0x8000 : v * 0x7fff, true);
  }
  return out.buffer;
}

// Səsləndirmənin gücündən hər kadr üçün ağzın açıqlığı (0..1)
function agizZerfi(sesBuf, fps, ofset, kadrSayi) {
  const d = sesBuf.getChannelData(0), sr = sesBuf.sampleRate, pen = Math.floor(sr / fps);
  const rms = [];
  for (let i = 0; i * pen < d.length; i++) {
    let x = 0; const s = i * pen, e = Math.min(d.length, s + pen);
    for (let j = s; j < e; j++) x += d[j] * d[j];
    rms.push(Math.sqrt(x / (e - s)));
  }
  const sirali = [...rms].sort((a, b) => a - b), tavan = sirali[Math.floor(sirali.length * 0.95)] || 1;
  const z = new Float32Array(kadrSayi);
  let evvel = 0;
  for (let k = 0; k < kadrSayi; k++) {
    const i = k - Math.round(ofset * fps);
    let v = i >= 0 && i < rms.length ? rms[i] / tavan : 0;
    v = Math.max(0, Math.min(1, (v - 0.12) / 0.8));
    evvel = v > evvel ? lerp(evvel, v, 0.75) : lerp(evvel, v, 0.45); // tez açılır, yumşaq bağlanır
    z[k] = evvel;
  }
  return z;
}
