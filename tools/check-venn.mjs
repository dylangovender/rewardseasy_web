#!/usr/bin/env node
// Checks that every logo tile in the site's Venn diagrams sits inside the right circle region
// (all four corners) with no overlapping tiles, at several desktop widths. Exits 1 on failure.
//
// Usage: node tools/check-venn.mjs [url ...]   (default: both Venn pages on the local Hugo server)
import { openPage } from './lib/chrome.mjs';

const BASE = 'http://localhost:1313/posts/';
const urls = process.argv.length > 2 ? process.argv.slice(2) : [`${BASE}everyday-shops/`, `${BASE}partner-breakdown/`];
const WIDTHS = [920, 1280, 1600];
// Must match the circles in layouts/shortcodes/partner-venn.html and key-venn.html.
const GEOMETRY = { circles: { E: [345, 345], D: [655, 345], U: [500, 610] }, r: 330, view: [1000, 990] };

function inspect({ circles, r, view }) {
  return [...document.querySelectorAll('.pvenn')].map((venn) => {
    const name = venn.classList.contains('pvenn--key') ? 'everyday-shops' : 'overlap';
    if (getComputedStyle(venn.querySelector('.pvenn-bg')).display === 'none') return { name, stacked: true };
    const box = venn.getBoundingClientRect();
    const sx = view[0] / box.width, sy = view[1] / box.height;
    const inside = (k, x, y) => (x - circles[k][0]) ** 2 + (y - circles[k][1]) ** 2 <= r * r;
    const bad = [];
    const rects = [];
    venn.querySelectorAll('.pvenn-cluster').forEach((cluster) => {
      const region = cluster.className.match(/r-(\w+)/)[1];
      cluster.querySelectorAll('.ptile').forEach((tile) => {
        const t = tile.getBoundingClientRect();
        rects.push(t);
        const label = (tile.querySelector('img') || {}).alt || tile.textContent.trim();
        const errs = new Set();
        [[t.left, t.top], [t.right, t.top], [t.left, t.bottom], [t.right, t.bottom]].forEach(([px, py]) => {
          const x = (px - box.left) * sx, y = (py - box.top) * sy;
          ['E', 'U', 'D'].forEach((k) => {
            const want = region.includes(k);
            if (inside(k, x, y) !== want) errs.add(`${k}${want ? '-out' : '-in'}`);
          });
        });
        if (errs.size) bad.push(`${region} ${label}: ${[...errs].join(',')}`);
      });
    });
    let overlaps = 0;
    for (let i = 0; i < rects.length; i++)
      for (let j = i + 1; j < rects.length; j++) {
        const a = rects[i], b = rects[j];
        if (a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1) overlaps++;
      }
    return { name, width: Math.round(box.width), tiles: rects.length, bad, overlaps };
  });
}

let failed = false;
const { browser, page } = await openPage();
try {
  for (const url of urls) {
    console.log(url);
    for (const width of WIDTHS) {
      await page.setViewport({ width, height: 1000 });
      const res = await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
      await new Promise((r) => setTimeout(r, 300));
      if (!res || res.status() >= 400) { console.log(`  ${width}px  FAIL: returned ${res ? res.status() : 'no response'}`); failed = true; continue; }
      const venns = await page.evaluate(inspect, GEOMETRY);
      if (venns.length === 0) { console.log(`  ${width}px  FAIL: no Venn diagrams found on the page`); failed = true; continue; }
      for (const v of venns) {
        if (v.stacked) { console.log(`  ${width}px  ${v.name}: stacked layout`); continue; }
        const ok = v.bad.length === 0 && v.overlaps === 0;
        if (!ok) failed = true;
        console.log(`  ${width}px  ${v.name}: ${ok ? 'OK' : 'FAIL'}  ${v.tiles - v.bad.length}/${v.tiles} tiles placed, ${v.overlaps} overlaps`);
        v.bad.forEach((b) => console.log(`          ${b}`));
      }
    }
  }
} finally {
  await browser.close();
}
process.exit(failed ? 1 : 0);
