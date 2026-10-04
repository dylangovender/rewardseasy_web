// Shared launcher: drives the installed Google Chrome headlessly via puppeteer-core.
import puppeteer from 'puppeteer-core';

const DEFAULT_CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

export async function openPage({ width = 1280, height = 1000, scheme = 'light' } = {}) {
  const browser = await puppeteer.launch({
    executablePath: process.env.CHROME_PATH || DEFAULT_CHROME,
    headless: true,
    args: ['--no-first-run', '--no-default-browser-check'],
  });
  const page = await browser.newPage();
  await page.setCacheEnabled(false); // always fetch fresh CSS/HTML from the dev server
  await page.setViewport({ width, height });
  await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: scheme }]);
  return { browser, page };
}

export async function load(page, url, waitMs = 0) {
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
  if (waitMs) await new Promise((r) => setTimeout(r, waitMs));
}
