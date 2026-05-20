const MAGIC_BYTES: Record<string, Buffer> = {
  pdf: Buffer.from([0x25, 0x50, 0x44, 0x46]),
  jpg: Buffer.from([0xff, 0xd8, 0xff]),
  jpeg: Buffer.from([0xff, 0xd8, 0xff]),
  png: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  docx: Buffer.from([0x50, 0x4b, 0x03, 0x04]),
  xlsx: Buffer.from([0x50, 0x4b, 0x03, 0x04]),
  doc: Buffer.from([0xd0, 0xcf, 0x11, 0xe0]),
  xls: Buffer.from([0xd0, 0xcf, 0x11, 0xe0]),
};

export function validateMagicBytes(
  filename: string,
  base64Content: string
): boolean {
  const ext = filename.split(".").pop()?.toLowerCase();
  if (!ext || !(ext in MAGIC_BYTES)) return false;
  const buffer = Buffer.from(base64Content.slice(0, 32), "base64");
  const expected = MAGIC_BYTES[ext];
  return buffer.slice(0, expected.length).equals(expected);
}
