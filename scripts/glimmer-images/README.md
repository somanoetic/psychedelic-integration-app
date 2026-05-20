# Glimmer Swiper image pipeline

Local utilities for processing images bundled into the Glimmer Swiper game.
Used to refresh the libraries at `assets/images/glimmer-swiper/{faces,nature}/`.

## Setup

`sharp` is required and is **not in committed package.json** (intentionally
kept out of the app dependency tree). If `node_modules/sharp` is missing,
install it before running any script:

```
npm install --save-dev sharp
```

Then revert the package.json/package-lock.json changes when you're done if
you don't want sharp lingering in your working tree.

For the landscape downloader, you also need an Unsplash access key:

```
$env:UNSPLASH_ACCESS_KEY = "your-key"   # PowerShell
```

Free demo apps get 50 requests/hour. Each search call counts, and so do the
ToS download-ping calls — budget about 5 search queries per hour window.

## Scripts

- `resize.js` — Resize a folder of images to 400x400 with sharp's
  attention-strategy crop (entropy-based, works ~85% well for portraits).
  ```
  node scripts/glimmer-images/resize.js --input <dir> --output <dir>
  ```

- `download-landscapes.js` — Pull ~70 curated calming landscapes from
  Unsplash search API into `staging-nature/`. Writes `_credits.json`
  alongside for photographer attribution.

- `contact-sheet.js` — Build a numbered grid PNG of every image in a folder.
  Lets you review the full set at a glance and call out which to drop by
  number.
  ```
  node scripts/glimmer-images/contact-sheet.js \
    --input assets/images/glimmer-swiper/faces \
    --output scripts/glimmer-images/face-contact-sheet.png \
    --prefix face
  ```

- `drop-and-renumber.js` — Delete specific numbered files and renumber the
  rest sequentially, no gaps. Works in-place on the final folder.
  ```
  node scripts/glimmer-images/drop-and-renumber.js \
    --dir assets/images/glimmer-swiper/faces \
    --prefix face \
    --drop 5,8,14
  ```

- `finalize.js` — **Destructive.** Wipes the final asset folders, copies
  resized images from staging, renames to `face_N.jpg`/`nature_N.jpg`,
  regenerates `data/glimmerSwiperImages.js`. Run only after staging has
  been reviewed.

## Staging folders

`staging-faces/`, `staging-nature/`, and `staging-nature-resized/` are
gitignored — they hold intermediate work between pipeline steps and aren't
meant to be committed.

`*-contact-sheet.png` is also gitignored for the same reason.

## Credits

`data/glimmerImageCredits.json` maps each landscape file to its Unsplash
photographer. If/when we add an in-app credits screen, that's the source.
Faces don't have a credits manifest yet — the original Feb 2026 batch
predates the pipeline.
