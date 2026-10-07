# AI Family Signature Artwork — kiosk app

React + Vite version of `AI SIGNATURE ART .html`, turned from a self-playing demo into a working kiosk.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # static files in dist/
```

## Flow
1. **Welcome** – touch anywhere to start.
2. **Choose** – Falcon, UAE Map, Palm Tree or Family Tree.
3. **Sign** – family name + up to 8 signature pads (touch, mouse or stylus; undo / clear / add / remove).
4. **Create** – the layout engine (`src/lib/layout.js`) packs the *actual drawn strokes* into the shape,
   following its flow, with pixel-accurate collision checks. Each family gets a unique composition.
5. **Preview** – switch colour story; go back to change design or signatures.
6. **Print** – opens the print dialog with a print-only 40×50 cm sheet (artwork + family name).
   On a real kiosk run Chrome with `--kiosk --kiosk-printing` to print silently.
7. **Take home** – plaque with family name, design and date.
8. **Share** – download a 1600×2000 PNG, share via the Web Share API (falls back to download), print again, finish.

The session resets to the welcome screen after 2 minutes without a touch (`IDLE_MS` in `src/data.js`).

All fonts (Oswald, Noto Sans, Noto Naskh/Sans Arabic, Caveat, Aref Ruqaa) are bundled via Fontsource (`src/fonts.js`), so the kiosk runs fully offline.

## Deploy to Vercel
`vercel.json` is included (Vite preset, `dist/` output, long-term caching for hashed assets, SPA fallback).

- **CLI:** `npm i -g vercel`, then run `vercel` (preview) or `vercel --prod` from this folder.
- **Git:** push to GitHub and import the repo in Vercel. If the repo root is the parent `signature/` folder, set **Root Directory** to `signature-app`.

Vercel serves over HTTPS, so the Share button uses the native share sheet on phones/tablets.
