const sharp = require("sharp");
const path = require("path");

async function processBikini() {
  const input = path.join(__dirname, "../app/assets/bikini.jpg");
  const output = path.join(__dirname, "../public/assets/bikini.png");

  const { data, info } = await sharp(input).raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const out = Buffer.alloc(width * height * 4);

  // Terracotta: #e5652d = 229, 101, 45
  const tr = 229, tg = 101, tb = 45;

  for (let i = 0; i < width * height; i++) {
    const r = data[i * channels + 0];
    const g = data[i * channels + 1];
    const b = data[i * channels + 2];
    const brightness = (r + g + b) / 3;

    // Beige bg ~brightness 184, dark lines ~brightness 53
    // Threshold at 150: lines become opaque, bg becomes transparent
    const alpha = Math.max(0, Math.min(255, Math.round((150 - brightness) * 4)));

    out[i * 4 + 0] = tr;
    out[i * 4 + 1] = tg;
    out[i * 4 + 2] = tb;
    out[i * 4 + 3] = alpha;
  }

  await sharp(out, { raw: { width, height, channels: 4 } }).png().toFile(output);
  console.log("Done: bikini.png -> " + output);
}

processBikini().catch(console.error);
