// Erzeugt src/app/icon.png und src/app/apple-icon.png aus docs/favicon.svg.
// Aufruf: node scripts/favicon.mjs (sharp kommt mit Next.js mit).
import { readFileSync, writeFileSync } from "node:fs";
import sharp from "sharp";

const svg = readFileSync(new URL("../docs/favicon.svg", import.meta.url));

// Zeichnung freistellen und mit Rand ins Quadrat setzen.
async function figur(groesse, rand) {
  const roh = await sharp(svg, { density: 384 }).trim().png().toBuffer();
  const innen = groesse - 2 * rand;
  return sharp(roh)
    .resize(innen, innen, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .extend({ top: rand, bottom: rand, left: rand, right: rand, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
}

// Weisser «Sticker»-Rand, damit das Icon auch in dunklen Browserleisten sichtbar bleibt.
async function sticker(bild, groesse, breite) {
  const alpha = await sharp(bild).extractChannel("alpha").blur(breite).threshold(8).toBuffer();
  const weiss = await sharp({ create: { width: groesse, height: groesse, channels: 3, background: "#ffffff" } })
    .joinChannel(alpha)
    .png()
    .toBuffer();
  return sharp(weiss).composite([{ input: bild }]).png().toBuffer();
}

const icon = await sticker(await figur(512, 30), 512, 9);
writeFileSync(new URL("../src/app/icon.png", import.meta.url), icon);

// iOS stellt Transparenz auf dem Homescreen schwarz dar: deckender, heller Hintergrund.
const apple = await sharp({ create: { width: 180, height: 180, channels: 3, background: "#dbeafe" } })
  .composite([{ input: await sharp(icon).resize(160, 160).png().toBuffer(), left: 10, top: 10 }])
  .removeAlpha()
  .png()
  .toBuffer();
writeFileSync(new URL("../src/app/apple-icon.png", import.meta.url), apple);
console.log("icon.png (512, transparent) und apple-icon.png (180, deckend) geschrieben");
