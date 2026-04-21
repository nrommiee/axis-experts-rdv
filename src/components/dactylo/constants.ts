export const MAX_FILE_SIZE = 20 * 1024 * 1024;
export const MAX_FILES_PER_ROW = 10;

export const DOCX_EXTENSION = ".docx";
export const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

// ZIP file magic number — every .docx is a ZIP container.
export const ZIP_MAGIC = [0x50, 0x4b, 0x03, 0x04] as const;
