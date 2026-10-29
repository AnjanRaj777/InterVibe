/** Object storage boundary. S3-compatible in prod, memory in tests. */
export interface Storage {
  /** Short-lived URL for direct browser uploads (unused in v1, kept for later). */
  presignedPutUrl(args: {
    key: string;
    contentType: string;
    maxBytes: number;
  }): Promise<string>;
  /** Server-side write. The API proxies all uploads, so browsers never touch storage. */
  putBytes(key: string, bytes: Uint8Array, contentType: string): Promise<void>;
  getObjectBytes(key: string): Promise<Uint8Array>;
  objectSize(key: string): Promise<number>;
}

const EXT: Record<string, string> = {
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "text/plain": "txt",
};

/**
 * Deterministic key from server-minted ids only — the filename is never trusted.
 * upload-url and complete derive the identical key independently.
 */
export function storageKey(sessionId: string, docId: string, contentType: string): string {
  const ext = EXT[contentType] ?? "bin";
  return `sessions/${sessionId}/${docId}.${ext}`;
}

/** Test/CI store. Never used in production. */
export function createMemoryStorage(): Storage {
  const objects = new Map<string, Uint8Array>();
  return {
    async putBytes(key, bytes) {
      objects.set(key, bytes);
    },
    async presignedPutUrl({ key }) {
      return `memory://upload/${encodeURIComponent(key)}`;
    },
    async getObjectBytes(key) {
      const b = objects.get(key);
      if (!b) throw new Error(`Object not found: ${key}`);
      return b;
    },
    async objectSize(key) {
      return (await this.getObjectBytes(key)).length;
    },
  };
}
