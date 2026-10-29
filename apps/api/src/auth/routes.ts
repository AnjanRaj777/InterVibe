import { Hono } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import {
  MAGIC_LINK_TTL_MS,
  SESSION_TTL_MS,
  newRawToken,
  sha256Hex,
  type AuthStore,
} from "./store.js";

export const SESSION_COOKIE = "iv_session";

export interface AuthEnv {
  store: AuthStore;
  appUrl: string;
  isProd: boolean;
  /** Sends the link in production; Phase 0 dev default logs it. */
  sendLink: (email: string, link: string) => Promise<void> | void;
}

/** POST /auth/request-link {email} -> always {ok:true} (no account probing). */
export function requestLinkRoute(env: AuthEnv) {
  return async (c: { json: (b: unknown) => unknown; req: { json: () => Promise<unknown> } }) => {
    const body = (await c.req.json().catch(() => ({}))) as { email?: unknown };
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return (c as { json: (b: unknown, s: number) => unknown }).json(
        { error: "Enter a valid email address." },
        400,
      );
    }
    let user = await env.store.findUserByEmail(email);
    user ??= await env.store.createUser(email);
    const raw = newRawToken();
    await env.store.saveMagicToken({
      tokenHash: sha256Hex(raw),
      userId: user.id,
      expiresAt: new Date(Date.now() + MAGIC_LINK_TTL_MS),
    });
    await env.sendLink(email, `${env.appUrl}/api/auth/callback?token=${raw}`);
    return (c as { json: (b: unknown) => unknown }).json({ ok: true });
  };
}

async function issueSession(
  c: { json: (b: unknown, s?: number) => unknown },
  env: AuthEnv,
  userId: string,
) {
  const cookie = newRawToken();
  await env.store.createSession({
    userId,
    cookie,
    expiresAt: new Date(Date.now() + SESSION_TTL_MS),
  });
  return { cookie };
}

export function buildAuthApp(env: AuthEnv): Hono {
  const app = new Hono();

  app.post("/request-link", requestLinkRoute(env) as never);

  /** Dev-only one-click sign-in. Returns 404 in production. */
  app.post("/dev-login", async (c) => {
    if (env.isProd) return c.json({ error: "Not found." }, 404);
    let user = await env.store.findUserByEmail("demo@intervibe.local");
    user ??= await env.store.createUser("demo@intervibe.local");
    const { cookie } = await issueSession(c, env, user.id);
    setCookie(c, SESSION_COOKIE, cookie, {
      httpOnly: true,
      sameSite: "Lax",
      secure: false,
      path: "/",
      maxAge: SESSION_TTL_MS / 1000,
    });
    return c.json({ ok: true, email: user.email });
  });

  app.get("/callback", async (c) => {
    const token = c.req.query("token") ?? "";
    const user = await env.store.consumeMagicToken(sha256Hex(token));
    if (!user) return c.json({ error: "This sign-in link is invalid or expired." }, 400);
    const { cookie } = await issueSession(c, env, user.id);
    setCookie(c, SESSION_COOKIE, cookie, {
      httpOnly: true,
      sameSite: "Lax",
      secure: env.isProd,
      path: "/",
      maxAge: SESSION_TTL_MS / 1000,
    });
    return c.redirect(env.appUrl, 302);
  });

  app.get("/me", async (c) => {
    const cookie = getCookie(c, SESSION_COOKIE);
    if (!cookie) return c.json({ error: "Not signed in." }, 401);
    const user = await env.store.findUserByCookie(cookie);
    if (!user) return c.json({ error: "Not signed in." }, 401);
    return c.json({ id: user.id, email: user.email });
  });

  app.post("/logout", async (c) => {
    const cookie = getCookie(c, SESSION_COOKIE);
    if (cookie) await env.store.deleteSession(cookie);
    deleteCookie(c, SESSION_COOKIE, { path: "/" });
    return c.json({ ok: true });
  });

  return app;
}
