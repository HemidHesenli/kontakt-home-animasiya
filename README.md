# Kontakt Home — animasiyalı kampaniya videosu

Kontakt Home-un "18 aya faizsiz, komissiyasız" kampaniyası (2–4 oktyabr) üçün 43 saniyəlik reklam videosu. Video tam kodla hazırlanıb: brendin maskot personajı ekranın kənarından çıxır, kampaniyanı və LG paltaryuyan maşınını təqdim edir, sonda tamaşaçını kontakt.az saytına dəvət edir.

> Öz təşəbbüsümlə hazırladığım portfolio işidir. Kontakt Home ilə rəsmi əlaqəsi yoxdur.

![Videodan kadrlar](onizleme/kadrlar.jpg)

**Videoya baxmaq:** [kontakt-kampaniya.mp4](kontakt-kampaniya.mp4) (1080×1920, Reels/TikTok formatı, səsli)

## Nə edilib

- **Personaj animasiyası** — maskot canvas üzərində vektorla çəkilir: yeriş, qaçış, tullanma və salto, musiqinin ritminə uyğun rəqs, əl çalma, işarə etmə.
- **Üz ifadələri** — ulduz və ürək gözlər, göz qırpma, göz vurma, tər damcıları.
- **Dodaq sinxronu** — ağız səsləndirmənin gücünə uyğun olaraq hər kadrda açılıb-bağlanır.
- **Səs** — səsləndirmə ElevenLabs ilə yaradılıb. Səs effektləri (vıjıltı, pop, kassa "çinq"i, saat tıqqıltısı, konfeti, əl çalma) və fon musiqisi Web Audio API ilə kodla sintez olunur.
- **Səhnələr mətnə sinxrondur** — hər yazı və effekt səsləndirmədə deyildiyi saniyədə çıxır.
- **Render** — kadrlar gizli Microsoft Edge-də çəkilir və FFmpeg ilə MP4-ə yığılır. Səs səviyyəsi sosial şəbəkə standartına (−14 LUFS) uyğunlaşdırılır.

Layihə [Claude Code](https://claude.com/claude-code) ilə hazırlanıb.

## İşə salmaq

Lazım olanlar: Windows, [Node.js](https://nodejs.org), Microsoft Edge və [FFmpeg](https://ffmpeg.org).

| Fayl | Nə edir |
| --- | --- |
| `onizle.bat` | Brauzerdə səsli önizləmə açır (http://localhost:5182) |
| `hazirla.bat` | Videonu yenidən render edib `kontakt-kampaniya.mp4` faylını yaradır |

## Fayllar

| Fayl | Məzmun |
| --- | --- |
| `video.js` | Səhnələr, mətnlər, zaman cədvəli, personajın hərəkətləri |
| `personaj.js` | Maskotun çəkilməsi (bədən, qollar, ayaqlar, üz ifadələri) |
| `sesler.js` | Səs effektləri, fon musiqisi, dodaq sinxronu |
| `render.js` | Önizləmə serveri və MP4 render |
| `ses.mp3` | Səsləndirmə (ElevenLabs) |
| `sekiller/` | Məhsul şəkilləri və loqo |

Brend adı, loqo və məhsul şəkilləri sahiblərinə məxsusdur və burada yalnız nümunə məqsədilə istifadə olunub.
