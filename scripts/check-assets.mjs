import { readFileSync, statSync } from "node:fs";

function png(path) {
  const data = readFileSync(path);
  const signature = data.subarray(0, 8).toString("hex");
  if (signature !== "89504e470d0a1a0a") throw new Error(`${path} is not PNG`);
  return {
    width: data.readUInt32BE(16),
    height: data.readUInt32BE(20),
    colorType: data.readUInt8(25),
  };
}

const avatarPath = "docs/assets/deliveryguard-avatar.png";
const heroPngPath = "docs/assets/deliveryguard-hero.png";
const heroWebpPath = "docs/assets/deliveryguard-hero.webp";
const avatar = png(avatarPath);
const hero = png(heroPngPath);
const webp = readFileSync(heroWebpPath);
const failures = [];

if (avatar.width !== avatar.height || avatar.width < 1024) failures.push("avatar must be a high-resolution square");
if (avatar.colorType !== 6 && avatar.colorType !== 4) failures.push("avatar must contain an alpha channel");
if (Math.abs(hero.width / hero.height - 16 / 9) > 0.02) failures.push("hero must be 16:9");
if (webp.subarray(0, 4).toString("ascii") !== "RIFF" || webp.subarray(8, 12).toString("ascii") !== "WEBP") {
  failures.push("hero WebP signature is invalid");
}
if (statSync(heroWebpPath).size > 500_000) failures.push("hero WebP must stay below 500 KB");
if (statSync(avatarPath).size > 2_000_000) failures.push("avatar PNG must stay below 2 MB");

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Brand assets passed: avatar ${avatar.width}x${avatar.height}, hero ${hero.width}x${hero.height}.`);
}
