# tools

Dev helpers that drive your installed Google Chrome headlessly (via `puppeteer-core`, so no extra browser download). Not part of the Hugo build or the GitHub Pages deploy.

```bash
cd tools && npm install        # once
```

## Check the Partners page Venns

Start the Hugo dev server (port 1313), then:

```bash
node tools/check-venn.mjs
```

Checks that every logo tile in both Venn diagrams sits inside its correct circle region (all four corners) with no overlaps, at 920, 1280 and 1600 px. Exits non-zero on any failure, including if the page errors or has no Venns. Run it after changing brands, tiles, circles or the cluster positions in `assets/css/partners.css`.

## Render any page

```bash
node tools/browse.mjs <url> --text                         # print the rendered text
node tools/browse.mjs <url> --expr "document.title"        # run JS, print the result
node tools/browse.mjs <url> --screenshot out.png --full    # full-page screenshot
```

Options: `--width`, `--height`, `--scheme light|dark`, `--wait <ms>`, `--eval file.js`. Useful for the eBucks and UCount sites, whose content only appears after JavaScript runs. Set `CHROME_PATH` if Chrome isn't in `/Applications`.
