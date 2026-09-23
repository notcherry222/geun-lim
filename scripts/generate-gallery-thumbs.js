/**
 * 갤러리 그리드용 고품질 썸네일 생성
 * - 원본은 lightbox용으로 유지
 * - 색감: ICC 메타데이터 유지, chroma 4:4:4
 * - 화질: Lanczos3 + JPEG quality 92 (디스플레이 해상도 대비 여유)
 *
 * Usage: npm run thumbs
 */
const fs = require("node:fs");
const path = require("node:path");
const sharp = require("sharp");

const ROOT = path.join(__dirname, "..");
const SRC_DIR = path.join(ROOT, "assets", "images", "gallery");
const OUT_DIR = path.join(SRC_DIR, "thumbs");

/** 3열 그리드·레티나 대비 충분한 폭 (CSS ~120px × 3x ≈ 360, 여유 포함) */
const MAX_WIDTH = 960;
const JPEG_QUALITY = 92;

async function main() {
  if (!fs.existsSync(SRC_DIR)) {
    throw new Error(`Gallery folder not found: ${SRC_DIR}`);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });

  const files = fs
    .readdirSync(SRC_DIR)
    .filter((name) => /\.(jpe?g|png|webp)$/i.test(name))
    .sort();

  if (!files.length) {
    console.log("No gallery images found.");
    return;
  }

  console.log(`Generating ${files.length} thumbs → ${path.relative(ROOT, OUT_DIR)}`);
  console.log(`settings: maxWidth=${MAX_WIDTH}, quality=${JPEG_QUALITY}, chroma=4:4:4, keep ICC`);

  for (const name of files) {
    const input = path.join(SRC_DIR, name);
    const base = path.parse(name).name;
    const output = path.join(OUT_DIR, `${base}.jpg`);

    const before = fs.statSync(input).size;
    await sharp(input)
      .rotate()
      .resize({
        width: MAX_WIDTH,
        withoutEnlargement: true,
        kernel: sharp.kernel.lanczos3,
      })
      .withMetadata()
      .jpeg({
        quality: JPEG_QUALITY,
        chromaSubsampling: "4:4:4",
        mozjpeg: true,
      })
      .toFile(output);

    const after = fs.statSync(output).size;
    const meta = await sharp(output).metadata();
    console.log(
      `  ${name}  ${(before / 1024 / 1024).toFixed(2)}MB → thumbs/${base}.jpg  ${(after / 1024).toFixed(0)}KB  (${meta.width}×${meta.height})`
    );
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});