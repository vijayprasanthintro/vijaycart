/**
 * fetchCommonsImages.js
 *
 * Dev utility (not part of the app runtime). For every product in
 * backend/data/catalogSpecs.json it searches Wikimedia Commons for real photos
 * of that exact product, picks up to 5 distinct, relevant images and downloads
 * them into frontend/public/images/products/ so the store keeps serving images
 * from its own origin (the existing architecture — no hotlinking).
 *
 * Usage:
 *   node backend/utils/fetchCommonsImages.js            # report only, no download
 *   node backend/utils/fetchCommonsImages.js --download # fetch and save images
 *
 * Outputs backend/data/image-manifest.json mapping each slug to the local files
 * it received plus the Commons source titles (for attribution in the README).
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const SPECS_PATH = path.join(ROOT, 'backend', 'data', 'catalogSpecs.json');
const OUT_DIR = path.join(ROOT, 'frontend', 'public', 'images', 'products');
const MANIFEST_PATH = path.join(ROOT, 'backend', 'data', 'image-manifest.json');

const API = 'https://commons.wikimedia.org/w/api.php';
const UA = 'VijayCartDemo/1.0 (local catalog build; dev@vijaycart.local)';
const TARGET_IMAGES = 5;
const THUMB_WIDTH = 1000;
const MIN_DIM = 400;

// Titles that indicate a file is NOT a useful product photograph.
const BAD = [
  'logo', 'text', 'diagram', 'manual', 'screenshot', 'mockup', 'advertis',
  'press kit', 'presskit', ' icon', 'chart', 'flyer', 'poster', 'instruction',
  'screen', 'presentation', 'infographic', 'label design', 'kawaii',
  'wallpaper', 'snapshot of', 'web capture', ' render', 'render ',
  '3d model', 'cad ', 'drawing of', 'sketch',
  'webtekno', 'youtube', 'teknoloji', 'smartphonelord', 'technopedia',
  'gsmarena', '91mobiles', 'phonearena',
];

const BAD_EXT = ['svg', 'tif', 'tiff', 'gif', 'webm', 'mp4', 'pdf', 'ogg', 'avi'];

function norm(s = '') {
  return String(s)
    .toLowerCase()
    .replace(/^file:/, '')
    .replace(/\.[a-z0-9]{2,5}$/i, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokens(s = '') {
  return norm(s).split(' ').filter(Boolean);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function apiGet(params) {
  const url = new URL(API);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));
  for (let attempt = 1; attempt <= 6; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA } });
      if (res.status === 429) {
        const wait = 30 * attempt;
        console.log(`    429 on ${params.gsrsearch || params.srsearch || 'search'} — backing off ${wait}s`);
        await sleep(wait * 1000);
        continue;
      }
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      return await res.json();
    } catch (err) {
      if (attempt === 6) throw err;
      await sleep(3000 * attempt);
    }
  }
  throw new Error('API failed after retries');
}

async function searchFiles(query) {
  const data = await apiGet({
    action: 'query',
    format: 'json',
    generator: 'search',
    gsrsearch: query,
    gsrnamespace: 6,
    gsrlimit: 40,
    prop: 'imageinfo',
    iiprop: 'url|mime|size',
    iiurlwidth: THUMB_WIDTH,
  });
  const pages = (data && data.query && data.query.pages) ? Object.values(data.query.pages) : [];
  const out = [];
  for (const p of pages) {
    const ii = p.imageinfo && p.imageinfo[0];
    if (!ii) continue;
    const cleanFull = (ii.url || '').split('?')[0];
    const ext = (cleanFull.match(/\.([a-z0-9]{2,5})$/i) || [])[1];
    if (!ext || BAD_EXT.includes(ext.toLowerCase())) continue;
    if (!/^image\/(jpeg|png|webp)/.test(ii.mime || '')) continue;
    const title = p.title || '';
    const nt = norm(title);
    if (nt.length < 4) continue;
    if (BAD.some((b) => nt.includes(b))) continue;
    if (ii.width < MIN_DIM || ii.height < MIN_DIM) continue;
    out.push({
      title,
      nt,
      url: (ii.thumburl || cleanFull).split('?')[0],
      full: cleanFull,
      mime: ii.mime,
      width: ii.width,
      height: ii.height,
    });
  }
  return out;
}

function scoreCandidate(cand, specTokens, queryTokens) {
  const t = cand.nt;
  let score = 0;

  // Exactness: how many product tokens appear in the file title.
  const present = specTokens.filter((tok) => t.includes(tok)).length;
  const ratio = specTokens.length ? present / specTokens.length : 0;
  score += ratio * 100;

  // Whole-phrase match from the first query is a strong signal.
  const firstQuery = String(specTokens.join(' '));
  if (t.includes(firstQuery)) score += 25;

  // Query-token overlap (queries often include extra context words).
  const qpresent = queryTokens.filter((tok) => t.includes(tok)).length;
  const qratio = queryTokens.length ? qpresent / queryTokens.length : 0;
  score += qratio * 20;

  // File format preference.
  if (/\.jpe?g$/i.test(cand.full)) score += 3;
  else if (/\.png$/i.test(cand.full)) score += 1;

  // Higher resolution is slightly better, capped.
  score += Math.min(1, Math.min(cand.width, cand.height) / 3000) * 10;

  return score;
}

function pickImages(candidates, spec) {
  const specTokens = tokens(spec.name);
  const queryTokens = new Set();
  (spec.queries || []).forEach((q) => tokens(q).forEach((t) => queryTokens.add(t)));

  const exclude = (spec.exclude || []).map((e) => e.toLowerCase());
  const prefer = (spec.prefer || []).map((e) => e.toLowerCase());

  let pool = candidates;
  if (exclude.length) pool = pool.filter((c) => !exclude.some((e) => c.nt.includes(e)));
  if (prefer.length) {
    const kept = pool.filter((c) => prefer.some((e) => c.nt.includes(e)));
    if (kept.length >= TARGET_IMAGES) pool = kept;
  }

  const scored = pool
    .map((c) => ({ ...c, score: scoreCandidate(c, specTokens, [...queryTokens]) }))
    .sort((a, b) => b.score - a.score);

  const chosen = [];
  const seen = new Set();
  for (const c of scored) {
    // Skip near-duplicate titles (same normalized string).
    if (seen.has(c.nt)) continue;
    seen.add(c.nt);
    chosen.push(c);
    if (chosen.length >= TARGET_IMAGES) break;
  }
  return chosen;
}

function extFrom(url) {
  const m = url.match(/\.(jpe?g|png|webp)(?:\?.*)?$/i);
  return m ? m[1].toLowerCase() : 'jpg';
}

async function download(url, dest) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(dest, buf);
  return buf.length;
}

async function main() {
  const downloadMode = process.argv.includes('--download');
  const probeMode = process.argv.includes('--probe');

  if (probeMode) {
    const queries = process.argv.slice(2).filter((a) => a !== '--probe' && !a.startsWith('--'));
    for (const q of queries) {
      const files = await searchFiles(q);
      console.log(`\n[probe] "${q}" -> ${files.length} candidates`);
      files
        .sort((a, b) => b.width * b.height - a.width * a.height)
        .slice(0, 12)
        .forEach((f) => console.log(`   ${f.title} (${f.width}x${f.height})`));
      await sleep(1000);
    }
    return;
  }

  if (!fs.existsSync(SPECS_PATH)) {
    console.error(`Missing ${SPECS_PATH}`);
    process.exit(1);
  }
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const specs = JSON.parse(fs.readFileSync(SPECS_PATH, 'utf8'));
  const manifest = {};
  const report = [];
  let failures = 0;

  for (const spec of specs) {
    if (!spec || !spec.slug) continue;
    console.log(`\n[${spec.slug}] ${spec.name} (${spec.category})`);
    const all = [];
    const seenAll = new Set();
    for (const q of spec.queries || []) {
      let files = [];
      try {
        files = await searchFiles(q);
      } catch (err) {
        console.log(`    search "${q}" failed: ${err.message}`);
      }
      for (const f of files) {
        if (!seenAll.has(f.nt)) { seenAll.add(f.nt); all.push(f); }
      }
      await sleep(1200);
      if (all.length >= 60) break;
    }

    const picked = pickImages(all, spec);
    console.log(`    candidates: ${all.length}, picked: ${picked.length}`);
    picked.forEach((p, i) => console.log(`      ${i + 1}. ${p.title} (${p.width}x${p.height})`));

    if (picked.length < TARGET_IMAGES) {
      failures++;
      console.log(`    !! SHORTFALL: only ${picked.length}/${TARGET_IMAGES} images`);
    }

    report.push({ slug: spec.slug, name: spec.name, category: spec.category, picked: picked.map((p) => p.title), found: all.length });

    if (downloadMode) {
      const entries = [];
      for (let i = 0; i < picked.length; i++) {
        const p = picked[i];
        const local = `${spec.slug}-${i + 1}.${extFrom(p.full)}`;
        const dest = path.join(OUT_DIR, local);
        if (fs.existsSync(dest)) {
          console.log(`      exists ${local}`);
        } else {
          try {
            const bytes = await download(p.url, dest);
            console.log(`      saved ${local} (${(bytes / 1024).toFixed(0)} KB)`);
          } catch (err) {
            console.log(`      FAILED ${local}: ${err.message}`);
          }
          await sleep(300);
        }
        entries.push({ local: `/images/products/${local}`, source: p.title, mime: p.mime });
      }
      manifest[spec.slug] = { name: spec.name, category: spec.category, images: entries };
    }
  }

  if (downloadMode) {
    fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf8');
    console.log(`\nManifest written to ${MANIFEST_PATH}`);
  } else {
    const shortfalls = report.filter((r) => r.picked.length < TARGET_IMAGES);
    console.log(`\n===== SUMMARY =====`);
    console.log(`Products: ${report.length}, with < ${TARGET_IMAGES} images: ${shortfalls.length}`);
    shortfalls.forEach((r) => console.log(`  - ${r.slug} (${r.picked.length}/5)`));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
