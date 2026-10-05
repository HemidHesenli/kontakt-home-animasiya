// Kontakt Home videosu: önizləmə serveri və MP4 hazırlama.
//   node render.js          → MP4 hazırlayır (kontakt-kampaniya.mp4)
//   node render.js onizle   → yalnız server: http://localhost:5182 brauzerdə açılır
//   node render.js yoxla 3.6 22.9   → seçilmiş anların şəkilləri yoxla/ qovluğuna
const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn, execSync } = require('child_process');

const KOK = __dirname;
const PORT = 5182;
const REJIM = process.argv[2] || 'render';
const NETICE = path.join(KOK, 'kontakt-kampaniya.mp4');
const NOVLER = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.png': 'image/png', '.svg': 'image/svg+xml', '.mp3': 'audio/mpeg', '.jpg': 'image/jpeg',
};

const EDGE = [process.env['ProgramFiles(x86)'], process.env.ProgramFiles, process.env.LOCALAPPDATA]
  .filter(Boolean)
  .map(d => path.join(d, 'Microsoft', 'Edge', 'Application', 'msedge.exe'))
  .find(f => fs.existsSync(f));

const ISCI = path.join(os.tmpdir(), 'kontakt-video');
const KADRLAR = path.join(ISCI, 'kadrlar');
let bitdi = null, ugursuz = null, sayac = 0;

function bedenOxu(req) {
  return new Promise((ok, xeta) => {
    const hisseler = [];
    req.on('data', c => hisseler.push(c));
    req.on('end', () => ok(Buffer.concat(hisseler)));
    req.on('error', xeta);
  });
}

const server = http.createServer(async (req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  if (req.method === 'POST') {
    const beden = await bedenOxu(req);
    let m;
    if ((m = url.match(/^\/kadrlar\/(\d+)$/))) {
      JSON.parse(beden.toString()).forEach((b64, k) => {
        fs.writeFileSync(path.join(KADRLAR, String(Number(m[1]) + k).padStart(5, '0') + '.jpg'), Buffer.from(b64, 'base64'));
      });
      sayac += JSON.parse(beden.toString()).length;
      if (sayac % 150 < 15) process.stdout.write(`  ${sayac} kadr\r`);
    } else if ((m = url.match(/^\/yoxla\/([\d.]+)$/))) {
      const qovluq = path.join(KOK, 'yoxla');
      fs.mkdirSync(qovluq, { recursive: true });
      fs.writeFileSync(path.join(qovluq, `kadr-${m[1]}.jpg`), Buffer.from(JSON.parse(beden.toString())[0], 'base64'));
    } else if (url === '/ses') {
      fs.writeFileSync(path.join(ISCI, 'ses.wav'), beden);
      console.log('  səs hazırdır');
    } else if (url === '/xeta') {
      console.error('Səhifədə xəta:\n' + beden.toString());
      if (ugursuz) ugursuz(new Error('səhifə xətası'));
    } else if (url === '/bitir' && bitdi) {
      bitdi();
    }
    res.writeHead(200); return res.end('ok');
  }
  const fayl = path.join(KOK, url === '/' ? 'index.html' : url);
  if (!fayl.startsWith(KOK) || !fs.existsSync(fayl) || fs.statSync(fayl).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': NOVLER[path.extname(fayl).toLowerCase()] || 'application/octet-stream' });
  fs.createReadStream(fayl).pipe(res);
});

function edgeIleAc(sorgu, gozle = 600000) {
  const profil = path.join(os.tmpdir(), 'kontakt-edge-profil');
  const edge = spawn(EDGE, ['--headless=new', '--disable-gpu', '--no-first-run', '--mute-audio',
    '--force-device-scale-factor=1', '--window-size=1080,1920', '--user-data-dir=' + profil,
    `http://localhost:${PORT}/?${sorgu}`]);
  return new Promise((ok, xeta) => {
    bitdi = ok; ugursuz = xeta;
    setTimeout(() => xeta(new Error('Vaxt bitdi: brauzer cavab vermədi')), gozle);
  }).finally(() => { try { execSync(`taskkill /pid ${edge.pid} /T /F`, { stdio: 'ignore' }); } catch {} });
}

function ffmpeg(args) {
  return new Promise((ok, xeta) => {
    const p = spawn('ffmpeg', args);
    let err = '';
    p.stderr.on('data', d => { err += d; });
    p.on('error', e => xeta(new Error('ffmpeg tapılmadı: ' + e.message)));
    p.on('close', kod => kod === 0 ? ok() : xeta(new Error(err.slice(-1200))));
  });
}

async function mp4Hazirla() {
  fs.rmSync(ISCI, { recursive: true, force: true });
  fs.mkdirSync(KADRLAR, { recursive: true });
  console.log('Kadrlar çəkilir (1-3 dəqiqə)...');
  await edgeIleAc('render=1');
  console.log(`\nMP4 yığılır (${sayac} kadr)...`);
  await ffmpeg(['-y', '-loglevel', 'error',
    '-framerate', '30', '-start_number', '0', '-i', path.join(KADRLAR, '%05d.jpg'),
    '-i', path.join(ISCI, 'ses.wav'),
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p',
    '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11', '-ar', '44100',
    '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', NETICE]);
  fs.rmSync(ISCI, { recursive: true, force: true });
  console.log('Hazırdır: ' + NETICE);
}

server.listen(PORT, async () => {
  if (REJIM === 'onizle') {
    const url = `http://localhost:${PORT}/`;
    console.log('Önizləmə: ' + url + '   (bağlamaq üçün bu pəncərəni bağlayın)');
    spawn('cmd', ['/c', 'start', '', url], { detached: true, stdio: 'ignore' });
    return;
  }
  try {
    if (!EDGE) throw new Error('Microsoft Edge tapılmadı');
    if (REJIM === 'yoxla') {
      fs.mkdirSync(ISCI, { recursive: true });
      await edgeIleAc('yoxla=' + process.argv.slice(3).join(','), 120000);
      console.log('Yoxlama şəkilləri: ' + path.join(KOK, 'yoxla'));
    } else {
      await mp4Hazirla();
    }
  } catch (e) {
    console.error('Xəta: ' + e.message);
    process.exitCode = 1;
  }
  server.close();
  setTimeout(() => process.exit(), 300);
});
