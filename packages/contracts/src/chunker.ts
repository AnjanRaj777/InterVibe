/**
 * Sentence chunker for streaming LLM responses to TTS.
 * Splits incoming text tokens into speakable sentence chunks without splitting on:
 * - Abbreviations (e.g., vs., i.e., etc., Dr., Mr.)
 * - Decimals and currency ($1.25, 3.14, 0.5)
 * - Version numbers and code domain terms (v1.0, node.js, next.js)
 * - Ellipses (...)
 */

const KNOWN_ABBREVIATIONS = new Set([
  "e.g.",
  "i.e.",
  "vs.",
  "etc.",
  "dr.",
  "mr.",
  "mrs.",
  "ms.",
  "prof.",
  "sr.",
  "jr.",
  "inc.",
  "ltd.",
  "co.",
  "corp.",
  "dept.",
  "approx.",
  "est.",
  "no.",
  "al.",
]);

/**
 * Checks if a period at index `dotIdx` in `buffer` is part of an abbreviation,
 * decimal number, or identifier/code term.
 */
function isProtectedDot(buffer: string, dotIdx: number): boolean {
  // Check decimal: digit before and digit after (e.g. 3.14 or $1.25)
  const prevChar = dotIdx > 0 ? buffer[dotIdx - 1] : "";
  const nextChar = dotIdx + 1 < buffer.length ? buffer[dotIdx + 1] : "";
  if (/\d/.test(prevChar) && /\d/.test(nextChar)) {
    return true;
  }

  // Check version pattern: e.g. v1.2 or 3.2.7
  if (/[a-zA-Z0-9]/.test(prevChar) && /[a-zA-Z0-9]/.test(nextChar)) {
    // Looks like file.ext or domain.com or v1.0
    return true;
  }

  // Check ellipsis: preceded or followed by another dot
  if (prevChar === "." || nextChar === ".") {
    return true;
  }

  // Check known abbreviation ending at dotIdx
  // Look backwards for the word starting after whitespace or punctuation
  let start = dotIdx;
  while (start > 0 && !/\s/.test(buffer[start - 1])) {
    start--;
  }
  const candidateWord = buffer.slice(start, dotIdx + 1).toLowerCase();
  if (KNOWN_ABBREVIATIONS.has(candidateWord)) {
    return true;
  }

  // Check single uppercase letter abbreviation (e.g. initials "A. Smith")
  if (dotIdx - start === 1 && /[A-Z]/.test(buffer[start])) {
    return true;
  }

  return false;
}

/**
 * Finds the index of the first valid sentence split point in `buffer`.
 * Returns the end index (exclusive) of the sentence chunk, or -1 if no sentence boundary is complete.
 */
function findSentenceBoundary(buffer: string, isEnd = false): number {
  for (let i = 0; i < buffer.length; i++) {
    const ch = buffer[i];

    if (ch === "!" || ch === "?") {
      // Must be followed by space or end of input
      if (i + 1 === buffer.length) {
        if (isEnd) return buffer.length;
      } else if (/\s/.test(buffer[i + 1])) {
        return i + 1;
      }
    } else if (ch === ".") {
      if (isProtectedDot(buffer, i)) {
        continue;
      }
      // Followed by whitespace or quote + whitespace, or end of input
      if (i + 1 === buffer.length) {
        if (isEnd) return buffer.length;
      } else if (/\s/.test(buffer[i + 1])) {
        return i + 1;
      } else if ((buffer[i + 1] === '"' || buffer[i + 1] === "'") && (i + 2 === buffer.length || /\s/.test(buffer[i + 2]))) {
        return i + 2;
      }
    }
  }

  if (isEnd && buffer.trim().length > 0) {
    return buffer.length;
  }

  return -1;
}

export interface SentenceChunker {
  push(delta: string): string[];
  flush(): string[];
  reset(): void;
}

/**
 * Creates a stateful sentence chunker for streaming LLM text into discrete sentence chunks.
 */
export function createSentenceChunker(): SentenceChunker {
  let buffer = "";

  return {
    push(delta: string): string[] {
      buffer += delta;
      const chunks: string[] = [];

      while (buffer.length > 0) {
        const boundary = findSentenceBoundary(buffer, false);
        if (boundary === -1) {
          break;
        }

        const chunk = buffer.slice(0, boundary).trim();
        buffer = buffer.slice(boundary).trimStart();
        if (chunk.length > 0) {
          chunks.push(chunk);
        }
      }

      return chunks;
    },

    flush(): string[] {
      const chunks: string[] = [];
      const trimmed = buffer.trim();
      if (trimmed.length > 0) {
        chunks.push(trimmed);
      }
      buffer = "";
      return chunks;
    },

    reset(): void {
      buffer = "";
    },
  };
}

/**
 * Splits complete text into sentence chunks using the sentence chunker rules.
 */
export function splitIntoSentenceChunks(text: string): string[] {
  const chunker = createSentenceChunker();
  const chunks = chunker.push(text);
  const remaining = chunker.flush();
  return [...chunks, ...remaining];
}
