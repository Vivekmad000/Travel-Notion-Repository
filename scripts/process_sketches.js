// Removes cream/white background from sketch JPGs and recolors lines
// to our palette, outputting transparent PNGs.
const sharp = require("sharp");
const path = require("path");

const sketches = [
  {
    input: path.join(__dirname, "../app/assets/plane_beach.jpg"),
    output: path.join(__dirname, "../public/assets/plane_beach.png"),
    mode: "single",
    r: 53, g: 82, b: 172, // Navy
  },
  {
    input: path.join(__dirname, "../app/assets/beach_house.jpg"),
    output: path.join(__dirname, "../public/assets/beach_house.png"),
    mode: "dual",
    coolR: 53, coolG: 82, coolB: 172,
    warmR: 229, warmG: 101, warmB: 45,
  },
  {
    input: path.join(__dirname, "../app/assets/vacay_seats.png"),
    output: path.join(__dirname, "../public/assets/vacay_seats.png"),
    mode: "single",
    r: 229, g: 101, b: 45, // Terracotta orange
  },
  {
    input: path.join(__dirname, "../app/assets/plane.png"),
    output: path.join(__dirname, "../public/assets/plane.png"),
    mode: "single",
    r: 240, g: 236, b: 224, // Cream
  },
  {
    input: path.join(__dirname, "../app/assets/earth.png"),
    output: path.join(__dirname, "../public/assets/earth.png"),
    mode: "single",
    r: 240, g: 236, b: 224, // Cream
  },
  {
    input: path.join(__dirname, "../app/assets/city.png"),
    output: path.join(__dirname, "../public/assets/city.png"),
    mode: "single",
    r: 240, g: 236, b: 224, // Cream
  },
  {
    input: path.join(__dirname, "../app/assets/world.png"),
    output: path.join(__dirname, "../public/assets/world.png"),
    mode: "single",
    r: 240, g: 236, b: 224, // Cream
  },
  {
    input: path.join(__dirname, "../app/assets/pencil.png"),
    output: path.join(__dirname, "../public/assets/pencil.png"),
    mode: "single",
    r: 53, g: 82, b: 172,
  },
  {
    input: path.join(__dirname, "../app/assets/eyeglass.png"),
    output: path.join(__dirname, "../public/assets/eyeglass.png"),
    mode: "single",
    r: 53, g: 82, b: 172,
  },
];

async function processSketch(s) {
  const { data, info } = await sharp(s.input)
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  const out = Buffer.alloc(width * height * 4);

  for (let i = 0; i < width * height; i++) {
    const pr = data[i * channels + 0];
    const pg = data[i * channels + 1];
    const pb = data[i * channels + 2];
    const pa = channels === 4 ? data[i * channels + 3] : 255;

    // Respect existing transparency
    if (pa < 10) {
      out[i * 4 + 3] = 0;
      continue;
    }

    const brightness = (pr + pg + pb) / 3;
    const alpha = Math.max(0, Math.min(255, Math.round((210 - brightness) * 3)));

    let r, g, b;
    if (s.mode === "dual") {
      // Warm pixels (more red than blue) → terracotta; cool (more blue) → navy
      const isWarm = (pr - pb) > 10;
      r = isWarm ? s.warmR : s.coolR;
      g = isWarm ? s.warmG : s.coolG;
      b = isWarm ? s.warmB : s.coolB;
    } else {
      r = s.r; g = s.g; b = s.b;
    }

    out[i * 4 + 0] = r;
    out[i * 4 + 1] = g;
    out[i * 4 + 2] = b;
    out[i * 4 + 3] = alpha;
  }

  await sharp(out, { raw: { width, height, channels: 4 } }).png().toFile(s.output);
  console.log(`✓ ${path.basename(s.output)}`);
}

(async () => {
  for (const s of sketches) await processSketch(s);
  console.log("Done.");
})();
