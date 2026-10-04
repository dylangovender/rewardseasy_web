#!/usr/bin/env node
// Render a page in headless Chrome, then print its text, run JavaScript in it, or screenshot it.
// Works on JavaScript-rendered sites (eBucks, UCount) that plain fetches can't read.
//
// Usage: node tools/browse.mjs <url> [--text] [--expr "js" | --eval file.js]
//                              [--screenshot out.png] [--full]
//                              [--width 1280] [--height 1000] [--scheme light|dark] [--wait ms]
// --expr/--eval take a JS expression; wrap async code as (async () => { ... })().
import { readFile } from 'node:fs/promises';
import { openPage, load } from './lib/chrome.mjs';

const USAGE = 'usage: node tools/browse.mjs <url> [--text] [--expr js | --eval file] [--screenshot out.png] [--full] [--width n] [--height n] [--scheme light|dark] [--wait ms]';

function parse(argv) {
  const o = { width: 1280, height: 1000, scheme: 'light', wait: 0 };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--text') o.text = true;
    else if (a === '--full') o.full = true;
    else if (['--expr', '--eval', '--screenshot', '--scheme'].includes(a)) o[a.slice(2)] = argv[++i];
    else if (['--width', '--height', '--wait'].includes(a)) o[a.slice(2)] = Number(argv[++i]);
    else if (!a.startsWith('--') && !o.url) o.url = a;
    else { console.error(`unknown option ${a}\n${USAGE}`); process.exit(2); }
  }
  return o;
}

const opts = parse(process.argv.slice(2));
if (!opts.url) { console.error(USAGE); process.exit(2); }

const { browser, page } = await openPage(opts);
try {
  await load(page, opts.url, opts.wait);
  if (opts.text) console.log(await page.evaluate(() => document.body.innerText));
  if (opts.expr || opts.eval) {
    const code = opts.eval ? await readFile(opts.eval, 'utf8') : opts.expr;
    const result = await page.evaluate(code);
    console.log(typeof result === 'string' ? result : JSON.stringify(result, null, 2));
  }
  if (opts.screenshot) {
    await page.screenshot({ path: opts.screenshot, fullPage: Boolean(opts.full) });
    console.error(`saved ${opts.screenshot}`);
  }
} finally {
  await browser.close();
}
