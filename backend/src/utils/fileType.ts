// Recognises a file by its first bytes (magic numbers), never by the name or the declared MIME type.

export type FileKind = 'image' | 'pdf' | 'office' | 'media' | 'text';

const startsWith = (buffer: Buffer, bytes: number[], offset = 0): boolean =>
  buffer.length >= offset + bytes.length && bytes.every((byte, i) => buffer[offset + i] === byte);

const isImage = (b: Buffer): boolean =>
  startsWith(b, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]) || // PNG
  startsWith(b, [0xff, 0xd8, 0xff]) || // JPEG
  startsWith(b, [0x47, 0x49, 0x46, 0x38]) || // GIF
  (startsWith(b, [0x52, 0x49, 0x46, 0x46]) && startsWith(b, [0x57, 0x45, 0x42, 0x50], 8)); // WEBP

const isMedia = (b: Buffer): boolean =>
  startsWith(b, [0x66, 0x74, 0x79, 0x70], 4) || // MP4 / M4A / MOV (ftyp)
  startsWith(b, [0x49, 0x44, 0x33]) || // MP3 with ID3 tag
  startsWith(b, [0xff, 0xfb]) || // MP3 frame
  startsWith(b, [0x1a, 0x45, 0xdf, 0xa3]) || // WEBM
  startsWith(b, [0x4f, 0x67, 0x67, 0x53]); // OGG

// Any HTML-like tag (`<a`, `<img`, `</`, `<!`) or a javascript: URL anywhere in the file
const HTML_LIKE = /<\s*[a-z!/?]|javascript:/i;

// Plain text / CSV: no NUL bytes and no markup a browser could run (the whole file is checked; max 10 MB).
const isPlainText = (b: Buffer): boolean =>
  b.length > 0 && !b.includes(0) && !HTML_LIKE.test(b.toString('utf8'));

export const detectFileKind = (buffer: Buffer): FileKind | null => {
  if (isImage(buffer)) return 'image';
  if (startsWith(buffer, [0x25, 0x50, 0x44, 0x46])) return 'pdf'; // %PDF
  // DOCX/XLSX/PPTX/ZIP (PK) and old Office files (OLE)
  if (startsWith(buffer, [0x50, 0x4b, 0x03, 0x04]) || startsWith(buffer, [0xd0, 0xcf, 0x11, 0xe0])) return 'office';
  if (isMedia(buffer)) return 'media';
  if (isPlainText(buffer)) return 'text';
  return null;
};

export const isImageBuffer = (buffer: Buffer): boolean => isImage(buffer);
