import { describe, expect, it } from "vitest";
import { ConfigError, loadConfig } from "../src/config.js";

const valid = {
  DATABASE_URL: "postgres://u:p@localhost:5432/db",
  MODEL_API_KEY: "test-key",
  AUTH_SECRET: "a".repeat(32),
  APP_URL: "http://localhost:3000",
  STORAGE_ENDPOINT: "http://localhost:9000",
  STORAGE_BUCKET: "intervibe-docs",
  STORAGE_ACCESS_KEY: "minioadmin",
  STORAGE_SECRET_KEY: "minioadmin",
};

describe("loadConfig", () => {
  it("accepts a complete env", () => {
    expect(loadConfig(valid).PORT).toBe(8787);
  });

  it("names the missing MODEL_API_KEY", () => {
    const { MODEL_API_KEY: _omit, ...rest } = valid;
    expect(() => loadConfig(rest)).toThrowError(ConfigError);
    expect(() => loadConfig(rest)).toThrowError(/MODEL_API_KEY/);
  });

  it("rejects a short AUTH_SECRET", () => {
    expect(() => loadConfig({ ...valid, AUTH_SECRET: "short" })).toThrowError(/AUTH_SECRET/);
  });
});
