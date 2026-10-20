import sharp from 'sharp';
import { readFile, writeFile, readdir } from 'node:fs/promises';
const svg = await readFile('resources/icon.svg');
await writeFile('public/favicon.svg', svg);
await sharp(svg).resize(1024).png().toFile('ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png');
for (const [density, size] of Object.entries({ mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 })) {
  const dir = `android/app/src/main/res/mipmap-${density}`;
  await sharp(svg).resize(size).png().toFile(`${dir}/ic_launcher.png`);
  await sharp(svg).resize(size).png().toFile(`${dir}/ic_launcher_round.png`);
  // Adaptive icons need their artwork inside Android's safe region.
  const foregroundSize = size * 2.25;
  const mark = await sharp(svg).resize(Math.round(foregroundSize * 0.65)).png().toBuffer();
  await sharp({ create: { width: foregroundSize, height: foregroundSize, channels: 4, background: '#0f172a' } }).composite([{ input: mark }]).png().toFile(`${dir}/ic_launcher_foreground.png`);
}
const splash = async (path, width, height) => {
  const mark = await sharp(svg).resize(Math.round(Math.min(width, height) * 0.3)).png().toBuffer();
  await sharp({ create: { width, height, channels: 3, background: '#0f172a' } }).composite([{ input: mark }]).png().toFile(path);
};
for (const directory of await readdir('android/app/src/main/res')) {
  if (!directory.startsWith('drawable')) continue;
  const path = `android/app/src/main/res/${directory}/splash.png`;
  try { const { width, height } = await sharp(path).metadata(); await splash(path, width, height); }
  catch (error) { if (!String(error).includes('Input file is missing')) throw error; }
}
for (const name of ['splash-2732x2732.png', 'splash-2732x2732-1.png', 'splash-2732x2732-2.png']) await splash(`ios/App/App/Assets.xcassets/Splash.imageset/${name}`, 2732, 2732);
console.log('PackLight icons and launch images generated for both platforms.');
