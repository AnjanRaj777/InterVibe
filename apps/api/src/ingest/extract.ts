import { extractText as unpdfExtractText } from "unpdf";
import mammoth from "mammoth";

export const ALLOWED_CONTENT_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
] as const;

export class ExtractionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ExtractionError";
  }
}

export interface ExtractedText {
  text: string;
  /** True when the source exceeded maxChars and was cut. Surfaced to the user. */
  truncated: boolean;
}

/** Extracts plain text from an uploaded resume/JD file. Throws ExtractionError. */
export async function extractText(
  bytes: Uint8Array,
  contentType: string,
  maxChars = 200_000,
): Promise<ExtractedText> {
  if (bytes.length === 0) throw new ExtractionError("The uploaded file is empty.");
  // unpdf rejects Buffer (a Uint8Array subclass) — hand it a plain view.
  const data = new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let text: string;
  if (contentType === "application/pdf") {
    try {
      const { text: raw } = await unpdfExtractText(data, { mergePages: true });
      text = raw;
    } catch {
      throw new ExtractionError("Could not read this PDF. Try exporting it as plain text.");
    }
  } else if (
    contentType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    try {
      const { value } = await mammoth.extractRawText({ buffer: Buffer.from(bytes) });
      text = value;
    } catch {
      throw new ExtractionError("Could not read this Word file. Try saving it as PDF or TXT.");
    }
  } else if (contentType === "text/plain" || contentType.startsWith("text/")) {
    text = new TextDecoder().decode(bytes);
  } else {
    throw new ExtractionError(`Unsupported file type: ${contentType}. Use PDF, DOCX, or TXT.`);
  }
  text = text.replace(/\r\n/g, "\n").trim();
  if (!text) throw new ExtractionError("No readable text found in this file.");
  if (text.length > maxChars) return { text: text.slice(0, maxChars), truncated: true };
  return { text, truncated: false };
}
