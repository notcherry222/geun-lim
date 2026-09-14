const fs = require("node:fs");
const path = require("node:path");

const dir = path.join(__dirname, "..", "assets", "images");
fs.mkdirSync(dir, { recursive: true });

function svg(title, subtitle, w, h, c1, c2) {
  const fontTitle = Math.round(Math.min(w, h) * 0.055);
  const fontSub = Math.round(Math.min(w, h) * 0.032);
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${c1}"/>
      <stop offset="100%" stop-color="${c2}"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#g)"/>
  <circle cx="${w * 0.72}" cy="${h * 0.22}" r="${Math.min(w, h) * 0.18}" fill="rgba(255,255,255,0.12)"/>
  <circle cx="${w * 0.2}" cy="${h * 0.7}" r="${Math.min(w, h) * 0.24}" fill="rgba(0,0,0,0.08)"/>
  <text x="50%" y="46%" text-anchor="middle" fill="rgba(255,252,247,0.92)" font-family="Georgia, serif" font-size="${fontTitle}">${title}</text>
  <text x="50%" y="54%" text-anchor="middle" fill="rgba(255,252,247,0.72)" font-family="sans-serif" font-size="${fontSub}">${subtitle}</text>
</svg>
`;
}

const files = [
  ["hero.svg", svg("Gun & Chaelim", "Replace assets/images/hero.*", 1080, 1620, "#3f6b56", "#1d2c24")],
  ["gallery-01.svg", svg("Gallery 01", "assets/images/gallery-01.*", 900, 1200, "#5a7a68", "#2b3d33")],
  ["gallery-02.svg", svg("Gallery 02", "assets/images/gallery-02.*", 900, 1200, "#6d8574", "#314239")],
  ["gallery-03.svg", svg("Gallery 03", "assets/images/gallery-03.*", 900, 1200, "#4f7260", "#24352c")],
  ["gallery-04.svg", svg("Gallery 04", "assets/images/gallery-04.*", 900, 1200, "#7a9082", "#3a4c42")],
  ["gallery-05.svg", svg("Gallery 05", "assets/images/gallery-05.*", 900, 1200, "#557764", "#2a3b32")],
  ["gallery-06.svg", svg("Gallery 06", "assets/images/gallery-06.*", 900, 1200, "#658575", "#2f4138")],
];

for (const [name, content] of files) {
  fs.writeFileSync(path.join(dir, name), content, "utf8");
}

fs.writeFileSync(
  path.join(dir, "PHOTOS.txt"),
  [
    "사진 교체 방법",
    "1) 이 폴더에 jpg/png/webp 파일을 넣습니다.",
    "2) js/data.js 의 images.hero.src / images.gallery[].src 경로를 새 파일명으로 바꿉니다.",
    '예) src: "assets/images/hero.jpg"',
    "",
    "권장 비율",
    "- hero: 세로 3:4 ~ 9:16",
    "- gallery: 세로 3:4",
    "",
  ].join("\n"),
  "utf8"
);

console.log("placeholders written to", dir);
