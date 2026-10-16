// One-off helper: writes lightweight solid-color placeholder JPEGs into
// public/brand so the landing layout and build work before real photos arrive.
// Generates valid baseline JPEGs (no external deps) at a small fixed size.
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, "..", "public", "brand");
mkdirSync(outDir, { recursive: true });

const WIDTH = 64;
const HEIGHT = 64;

// Standard JPEG quantization + Huffman tables (Annex K luminance/chrominance).
const QT_LUMA = [
  16, 11, 10, 16, 24, 40, 51, 61, 12, 12, 14, 19, 26, 58, 60, 55, 14, 13, 16,
  24, 40, 57, 69, 56, 14, 17, 22, 29, 51, 87, 80, 62, 18, 22, 37, 56, 68, 109,
  103, 77, 24, 35, 55, 64, 81, 104, 113, 92, 49, 64, 78, 87, 103, 121, 120,
  101, 72, 92, 95, 98, 112, 100, 103, 99,
];
const QT_CHROMA = [
  17, 18, 24, 47, 99, 99, 99, 99, 18, 21, 26, 66, 99, 99, 99, 99, 24, 26, 56,
  99, 99, 99, 99, 99, 47, 66, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99,
  99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99,
  99, 99, 99, 99, 99, 99, 99,
];

const ZIGZAG = [
  0, 1, 8, 16, 9, 2, 3, 10, 17, 24, 32, 25, 18, 11, 4, 5, 12, 19, 26, 33, 40,
  48, 41, 34, 27, 20, 13, 6, 7, 14, 21, 28, 35, 42, 49, 56, 57, 50, 43, 36, 29,
  22, 15, 23, 30, 37, 44, 51, 58, 59, 52, 45, 38, 31, 39, 46, 53, 60, 61, 54,
  47, 55, 62, 63,
];

// Huffman tables (standard JPEG).
const STD_DC_LUMA_NRCODES = [0, 0, 1, 5, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0];
const STD_DC_LUMA_VALUES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const STD_AC_LUMA_NRCODES = [
  0, 0, 2, 1, 3, 3, 2, 4, 3, 5, 5, 4, 4, 0, 0, 1, 0x7d,
];
const STD_AC_LUMA_VALUES = [
  0x01, 0x02, 0x03, 0x00, 0x04, 0x11, 0x05, 0x12, 0x21, 0x31, 0x41, 0x06, 0x13,
  0x51, 0x61, 0x07, 0x22, 0x71, 0x14, 0x32, 0x81, 0x91, 0xa1, 0x08, 0x23, 0x42,
  0xb1, 0xc1, 0x15, 0x52, 0xd1, 0xf0, 0x24, 0x33, 0x62, 0x72, 0x82, 0x09, 0x0a,
  0x16, 0x17, 0x18, 0x19, 0x1a, 0x25, 0x26, 0x27, 0x28, 0x29, 0x2a, 0x34, 0x35,
  0x36, 0x37, 0x38, 0x39, 0x3a, 0x43, 0x44, 0x45, 0x46, 0x47, 0x48, 0x49, 0x4a,
  0x53, 0x54, 0x55, 0x56, 0x57, 0x58, 0x59, 0x5a, 0x63, 0x64, 0x65, 0x66, 0x67,
  0x68, 0x69, 0x6a, 0x73, 0x74, 0x75, 0x76, 0x77, 0x78, 0x79, 0x7a, 0x83, 0x84,
  0x85, 0x86, 0x87, 0x88, 0x89, 0x8a, 0x92, 0x93, 0x94, 0x95, 0x96, 0x97, 0x98,
  0x99, 0x9a, 0xa2, 0xa3, 0xa4, 0xa5, 0xa6, 0xa7, 0xa8, 0xa9, 0xaa, 0xb2, 0xb3,
  0xb4, 0xb5, 0xb6, 0xb7, 0xb8, 0xb9, 0xba, 0xc2, 0xc3, 0xc4, 0xc5, 0xc6, 0xc7,
  0xc8, 0xc9, 0xca, 0xd2, 0xd3, 0xd4, 0xd5, 0xd6, 0xd7, 0xd8, 0xd9, 0xda, 0xe1,
  0xe2, 0xe3, 0xe4, 0xe5, 0xe6, 0xe7, 0xe8, 0xe9, 0xea, 0xf1, 0xf2, 0xf3, 0xf4,
  0xf5, 0xf6, 0xf7, 0xf8, 0xf9, 0xfa,
];

function buildHuffTable(nrcodes, values) {
  const table = {};
  let code = 0;
  let k = 0;
  for (let bits = 1; bits <= 16; bits++) {
    for (let i = 0; i < nrcodes[bits]; i++) {
      table[values[k]] = { code, length: bits };
      code++;
      k++;
    }
    code <<= 1;
  }
  return table;
}

const dcLuma = buildHuffTable(STD_DC_LUMA_NRCODES, STD_DC_LUMA_VALUES);
const acLuma = buildHuffTable(STD_AC_LUMA_NRCODES, STD_AC_LUMA_VALUES);

// Bit writer
class BitWriter {
  constructor() {
    this.bytes = [];
    this.acc = 0;
    this.nbits = 0;
  }
  writeBits(code, length) {
    for (let i = length - 1; i >= 0; i--) {
      this.acc = (this.acc << 1) | ((code >> i) & 1);
      this.nbits++;
      if (this.nbits === 8) {
        const b = this.acc & 0xff;
        this.bytes.push(b);
        if (b === 0xff) this.bytes.push(0x00); // byte stuffing
        this.acc = 0;
        this.nbits = 0;
      }
    }
  }
  flush() {
    if (this.nbits > 0) {
      // pad remaining bits with 1s
      this.acc = (this.acc << (8 - this.nbits)) | ((1 << (8 - this.nbits)) - 1);
      const b = this.acc & 0xff;
      this.bytes.push(b);
      if (b === 0xff) this.bytes.push(0x00);
      this.acc = 0;
      this.nbits = 0;
    }
  }
}

function bitLength(v) {
  let n = 0;
  let a = Math.abs(v);
  while (a > 0) {
    a >>= 1;
    n++;
  }
  return n;
}

function amplitudeBits(v) {
  if (v >= 0) return v;
  const n = bitLength(v);
  return v + (1 << n) - 1;
}

// Encode a single grayscale solid color (luma only) as a 1-component JPEG.
function encodeSolidGray(width, height, luma) {
  const bw = new BitWriter();
  // DC coefficient for a flat block = (level - 128) / quant[0], rounded.
  const dcVal = Math.round((luma - 128) / QT_LUMA[0]);
  const blocksX = Math.ceil(width / 8);
  const blocksY = Math.ceil(height / 8);
  let prevDc = 0;
  for (let by = 0; by < blocksY; by++) {
    for (let bx = 0; bx < blocksX; bx++) {
      const diff = dcVal - prevDc;
      prevDc = dcVal;
      const size = diff === 0 ? 0 : bitLength(diff);
      const dcEntry = dcLuma[size];
      bw.writeBits(dcEntry.code, dcEntry.length);
      if (size > 0) bw.writeBits(amplitudeBits(diff), size);
      // All AC are zero -> EOB (0x00)
      const eob = acLuma[0x00];
      bw.writeBits(eob.code, eob.length);
    }
  }
  bw.flush();
  return Buffer.from(bw.bytes);
}

function u16(n) {
  return Buffer.from([(n >> 8) & 0xff, n & 0xff]);
}

function buildJpeg(width, height, luma) {
  const parts = [];
  parts.push(Buffer.from([0xff, 0xd8])); // SOI

  // APP0 / JFIF
  parts.push(Buffer.from([0xff, 0xe0]));
  parts.push(u16(16));
  parts.push(Buffer.from("JFIF\0", "latin1"));
  parts.push(Buffer.from([0x01, 0x01, 0x00]));
  parts.push(u16(1));
  parts.push(u16(1));
  parts.push(Buffer.from([0x00, 0x00]));

  // DQT (luma)
  parts.push(Buffer.from([0xff, 0xdb]));
  parts.push(u16(67));
  parts.push(Buffer.from([0x00]));
  const qt = Buffer.alloc(64);
  for (let i = 0; i < 64; i++) qt[i] = QT_LUMA[ZIGZAG[i]];
  parts.push(qt);

  // SOF0 (baseline, 1 component grayscale)
  parts.push(Buffer.from([0xff, 0xc0]));
  parts.push(u16(11));
  parts.push(Buffer.from([0x08]));
  parts.push(u16(height));
  parts.push(u16(width));
  parts.push(Buffer.from([0x01])); // 1 component
  parts.push(Buffer.from([0x01, 0x11, 0x00])); // id=1, 1x1 sampling, qt 0

  // DHT (DC luma)
  {
    const vals = STD_DC_LUMA_VALUES;
    const counts = STD_DC_LUMA_NRCODES.slice(1, 17);
    parts.push(Buffer.from([0xff, 0xc4]));
    parts.push(u16(2 + 1 + 16 + vals.length));
    parts.push(Buffer.from([0x00]));
    parts.push(Buffer.from(counts));
    parts.push(Buffer.from(vals));
  }
  // DHT (AC luma)
  {
    const vals = STD_AC_LUMA_VALUES;
    const counts = STD_AC_LUMA_NRCODES.slice(1, 17);
    parts.push(Buffer.from([0xff, 0xc4]));
    parts.push(u16(2 + 1 + 16 + vals.length));
    parts.push(Buffer.from([0x10]));
    parts.push(Buffer.from(counts));
    parts.push(Buffer.from(vals));
  }

  // SOS
  parts.push(Buffer.from([0xff, 0xda]));
  parts.push(u16(8));
  parts.push(Buffer.from([0x01])); // 1 component
  parts.push(Buffer.from([0x01, 0x00])); // component 1 uses DC0/AC0
  parts.push(Buffer.from([0x00, 0x3f, 0x00])); // Ss, Se, Ah/Al

  parts.push(encodeSolidGray(width, height, luma));

  parts.push(Buffer.from([0xff, 0xd9])); // EOI
  return Buffer.concat(parts);
}

const files = [
  { name: "hero-watch.jpg", luma: 24 }, // deep near-black hero backdrop
  { name: "lineup-left.jpg", luma: 60 }, // dark slate
  { name: "lineup-right.jpg", luma: 90 }, // mid slate
];

for (const f of files) {
  const buf = buildJpeg(WIDTH, HEIGHT, f.luma);
  writeFileSync(join(outDir, f.name), buf);
  console.log(`wrote ${f.name} (${buf.length} bytes)`);
}
