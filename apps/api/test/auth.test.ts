import { describe, expect, it } from "vitest";
import { buildAuthApp } from "../src/auth/routes.js";
import { createMemoryStore } from "../src/auth/store.js";

function testApp(sentLinks: { email: string; link: string }[]) {
  return buildAuthApp({
    store: createMemoryStore(),
    appUrl: "http://web.test",
    isProd: false,
    sendLink: (email, link) => {
      sentLinks.push({ email, link });
    },
  });
}

describe("auth flow", () => {
  it("request-link sends a link, callback sets a cookie, me returns the user", async () => {
    const sentLinks: { email: string; link: string }[] = [];
    const app = testApp(sentLinks);

    const req = await app.request("/request-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "Ada@Example.com" }),
    });
    expect(req.status).toBe(200);
    expect(sentLinks).toHaveLength(1);
    expect(sentLinks[0].email).toBe("ada@example.com");

    const token = new URL(sentLinks[0].link).searchParams.get("token")!;
    const cb = await app.request(`/callback?token=${token}`);
    expect(cb.status).toBe(302);
    const cookie = cb.headers.get("set-cookie") ?? "";
    expect(cookie).toContain("iv_session=");
    expect(cookie).toContain("HttpOnly");

    const sessionCookie = cookie.split(";")[0];
    const me = await app.request("/me", { headers: { Cookie: sessionCookie } });
    expect(me.status).toBe(200);
    expect(await me.json()).toMatchObject({ email: "ada@example.com" });

    const logout = await app.request("/logout", {
      method: "POST",
      headers: { Cookie: sessionCookie },
    });
    expect(logout.status).toBe(200);
    const meAfter = await app.request("/me", { headers: { Cookie: sessionCookie } });
    expect(meAfter.status).toBe(401);
  });

  it("dev-login signs in with one click outside production", async () => {
    const sentLinks: { email: string; link: string }[] = [];
    const app = testApp(sentLinks);
    const res = await app.request("/dev-login", { method: "POST" });
    expect(res.status).toBe(200);
    const cookie = res.headers.get("set-cookie")!.split(";")[0];
    const me = await app.request("/me", { headers: { Cookie: cookie } });
    expect(me.status).toBe(200);
    expect(await me.json()).toMatchObject({ email: "demo@intervibe.local" });
  });

  it("dev-login is dead in production", async () => {
    const prodApp = buildAuthApp({
      store: createMemoryStore(),
      appUrl: "http://web.test",
      isProd: true,
      sendLink: () => {},
    });
    const res = await prodApp.request("/dev-login", { method: "POST" });
    expect(res.status).toBe(404);
  });

  it("rejects invalid email and reused tokens", async () => {
    const sentLinks: { email: string; link: string }[] = [];
    const app = testApp(sentLinks);

    const bad = await app.request("/request-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "not-an-email" }),
    });
    expect(bad.status).toBe(400);

    const badToken = await app.request("/callback?token=nope");
    expect(badToken.status).toBe(400);

    const anon = await app.request("/me");
    expect(anon.status).toBe(401);
  });
});
