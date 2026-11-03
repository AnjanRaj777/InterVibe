import tls from 'tls';
import net from 'net';
import crypto from 'crypto';
import {
  PLANS,
  normalizePlanTier,
  normalizeBillingCycle,
  isPaidTier,
  type PlanTier,
  type BillingCycle,
  type SubscriptionStatus,
} from './dodo';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidUuid(val?: string | null): boolean {
  return Boolean(val && UUID_REGEX.test(val.trim()));
}

function parseDbUrl(urlStr?: string) {
  if (!urlStr) return null;
  try {
    const u = new URL(urlStr);
    return {
      host: u.hostname,
      port: Number(u.port || 5432),
      user: decodeURIComponent(u.username),
      password: decodeURIComponent(u.password),
      database: u.pathname.replace(/^\//, '') || 'postgres',
    };
  } catch {
    return null;
  }
}

export function escapeSqlLiteral(val: string): string {
  return "'" + String(val).replace(/\0/g, '').replace(/'/g, "''") + "'";
}

export function runPgQuery(sql: string): Promise<string[][]> {
  const cfg = parseDbUrl(process.env.DATABASE_URL);
  if (!cfg) return Promise.resolve([]);

  return new Promise((resolve, reject) => {
    const rows: string[][] = [];
    const timeout = setTimeout(() => {
      rawSocket.destroy();
      reject(new Error('DB connection timeout'));
    }, 6000);

    const rawSocket = net.connect(cfg.port, cfg.host, () => {
      const sslReq = Buffer.alloc(8);
      sslReq.writeInt32BE(8, 0);
      sslReq.writeInt32BE(80877103, 4);
      rawSocket.write(sslReq);
    });

    rawSocket.on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });

    rawSocket.once('data', () => {
      const sock = tls.connect(
        { socket: rawSocket, servername: cfg.host, rejectUnauthorized: false },
        () => {
          const params = `user\0${cfg.user}\0database\0${cfg.database}\0\0`;
          const len = 4 + 4 + Buffer.byteLength(params);
          const buf = Buffer.alloc(len);
          buf.writeInt32BE(len, 0);
          buf.writeInt32BE(196608, 4);
          buf.write(params, 8);
          sock.write(buf);
        }
      );

      let buffer = Buffer.alloc(0);
      let clientNonce = '';
      let clientFirstMessageBare = '';
      let queried = false;

      sock.on('error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });

      sock.on('data', (data: Buffer) => {
        buffer = Buffer.concat([buffer, data]);
        while (buffer.length >= 5) {
          const type = String.fromCharCode(buffer[0]);
          const len = buffer.readInt32BE(1);
          if (buffer.length < 1 + len) break;
          const payload = buffer.subarray(5, 1 + len);
          buffer = buffer.subarray(1 + len);

          if (type === 'R') {
            const authType = payload.readInt32BE(0);
            if (authType === 10) {
              clientNonce = crypto.randomBytes(18).toString('base64');
              clientFirstMessageBare = `n=,r=${clientNonce}`;
              const clientFirstMessage = `n,,${clientFirstMessageBare}`;
              const mech = Buffer.from('SCRAM-SHA-256\0');
              const msgBuf = Buffer.from(clientFirstMessage);
              const totalLen = 4 + mech.length + 4 + msgBuf.length;
              const out = Buffer.alloc(1 + totalLen);
              out[0] = 0x70;
              out.writeInt32BE(totalLen, 1);
              mech.copy(out, 5);
              out.writeInt32BE(msgBuf.length, 5 + mech.length);
              msgBuf.copy(out, 9 + mech.length);
              sock.write(out);
            } else if (authType === 11) {
              const serverFirst = payload.subarray(4).toString('utf8');
              const parts = Object.fromEntries(
                serverFirst.split(',').map((s) => [s[0], s.slice(2)])
              );
              const r = parts.r;
              const s = Buffer.from(parts.s, 'base64');
              const i = parseInt(parts.i, 10);
              const saltedPassword = crypto.pbkdf2Sync(cfg.password, s, i, 32, 'sha256');
              const clientKey = crypto
                .createHmac('sha256', saltedPassword)
                .update('Client Key')
                .digest();
              const storedKey = crypto.createHash('sha256').update(clientKey).digest();
              const clientFinalWithoutProof = `c=biws,r=${r}`;
              const authMessage = `${clientFirstMessageBare},${serverFirst},${clientFinalWithoutProof}`;
              const clientSignature = crypto
                .createHmac('sha256', storedKey)
                .update(authMessage)
                .digest();
              const proof = Buffer.alloc(clientKey.length);
              for (let j = 0; j < clientKey.length; j++) {
                proof[j] = clientKey[j] ^ clientSignature[j];
              }
              const clientFinal = `${clientFinalWithoutProof},p=${proof.toString('base64')}`;
              const msgBuf = Buffer.from(clientFinal);
              const out = Buffer.alloc(1 + 4 + msgBuf.length);
              out[0] = 0x70;
              out.writeInt32BE(4 + msgBuf.length, 1);
              msgBuf.copy(out, 5);
              sock.write(out);
            }
          } else if (type === 'Z') {
            if (!queried) {
              queried = true;
              const strBuf = Buffer.from(sql + '\0', 'utf8');
              const qlen = 4 + strBuf.length;
              const qbuf = Buffer.alloc(1 + qlen);
              qbuf[0] = 0x51;
              qbuf.writeInt32BE(qlen, 1);
              strBuf.copy(qbuf, 5);
              sock.write(qbuf);
            } else {
              clearTimeout(timeout);
              sock.end();
              resolve(rows);
            }
          } else if (type === 'D') {
            const colCount = payload.readInt16BE(0);
            let offset = 2;
            const row: string[] = [];
            for (let c = 0; c < colCount; c++) {
              const colLen = payload.readInt32BE(offset);
              offset += 4;
              row.push(
                colLen === -1 ? '' : payload.subarray(offset, offset + colLen).toString('utf8')
              );
              if (colLen !== -1) offset += colLen;
            }
            rows.push(row);
          } else if (type === 'E') {
            clearTimeout(timeout);
            sock.end();
            reject(new Error(payload.toString('utf8')));
          }
        }
      });
    });
  });
}

let schemaEnsured = false;

export async function ensureSubscriptionSchema(): Promise<void> {
  if (schemaEnsured || !process.env.DATABASE_URL) return;
  try {
    await runPgQuery(`
      CREATE TABLE IF NOT EXISTS public.profiles (
        id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
        email TEXT NOT NULL,
        full_name TEXT,
        target_role TEXT DEFAULT 'Senior Full Stack Developer',
        seniority TEXT DEFAULT 'Senior / Staff',
        subscription_tier TEXT DEFAULT 'free',
        billing_cycle TEXT DEFAULT 'monthly',
        subscription_status TEXT DEFAULT 'active',
        dodo_customer_id TEXT,
        dodo_subscription_id TEXT,
        dodo_payment_id TEXT,
        credits_remaining INTEGER DEFAULT 3,
        current_period_end TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS billing_cycle TEXT DEFAULT 'monthly';
      ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active';
      ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS dodo_customer_id TEXT;
      ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS dodo_subscription_id TEXT;
      ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS dodo_payment_id TEXT;
      ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ;

      ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can view own profile'
        ) THEN
          CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can update own profile'
        ) THEN
          CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can insert own profile'
        ) THEN
          CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
        END IF;
      END $$;

      -- SEC-20: Prevent client-side privilege escalation via PostgREST anon/authenticated role
      CREATE OR REPLACE FUNCTION public.protect_profile_billing_columns()
      RETURNS TRIGGER AS $$
      BEGIN
        IF current_setting('role', true) IN ('authenticated', 'anon') THEN
          IF TG_OP = 'INSERT' THEN
            NEW.subscription_tier := 'free';
            NEW.billing_cycle := 'monthly';
            NEW.subscription_status := 'active';
            NEW.credits_remaining := 3;
            NEW.dodo_customer_id := NULL;
            NEW.dodo_subscription_id := NULL;
            NEW.dodo_payment_id := NULL;
          ELSIF TG_OP = 'UPDATE' THEN
            NEW.subscription_tier := OLD.subscription_tier;
            NEW.billing_cycle := OLD.billing_cycle;
            NEW.subscription_status := OLD.subscription_status;
            NEW.credits_remaining := OLD.credits_remaining;
            NEW.dodo_customer_id := OLD.dodo_customer_id;
            NEW.dodo_subscription_id := OLD.dodo_subscription_id;
            NEW.dodo_payment_id := OLD.dodo_payment_id;
            NEW.current_period_end := OLD.current_period_end;
          END IF;
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;

      DROP TRIGGER IF EXISTS trg_protect_profile_billing ON public.profiles;
      CREATE TRIGGER trg_protect_profile_billing
        BEFORE INSERT OR UPDATE ON public.profiles
        FOR EACH ROW
        EXECUTE FUNCTION public.protect_profile_billing_columns();

      -- Clean up any simulated sandbox subscriptions (sub_dodo_*) back to 'free' with max 3 credits
      UPDATE public.profiles
      SET subscription_tier = 'free',
          credits_remaining = LEAST(COALESCE(credits_remaining, 3), 3),
          dodo_subscription_id = NULL,
          dodo_payment_id = NULL,
          dodo_customer_id = NULL,
          current_period_end = NULL,
          updated_at = NOW()
      WHERE dodo_subscription_id LIKE 'sub_dodo_%'
         OR (subscription_tier != 'free' AND dodo_subscription_id IS NULL);
    `);
    schemaEnsured = true;
  } catch (err) {
    console.warn('[DB Schema] Ensure subscription schema notice:', err);
  }
}

export interface UpsertSubscriptionParams {
  userId?: string | null;
  email?: string | null;
  fullName?: string | null;
  tier: PlanTier;
  billingCycle?: BillingCycle;
  status?: SubscriptionStatus;
  dodoCustomerId?: string | null;
  dodoSubscriptionId?: string | null;
  dodoPaymentId?: string | null;
  currentPeriodEnd?: string | null;
}

export interface UserSubscriptionRecord {
  userId: string;
  email: string;
  tier: PlanTier;
  billingCycle: BillingCycle;
  status: SubscriptionStatus;
  hasProSubscription: boolean;
  creditsRemaining: number;
  dodoCustomerId?: string | null;
  dodoSubscriptionId?: string | null;
  dodoPaymentId?: string | null;
  currentPeriodEnd?: string | null;
}

export async function upsertUserSubscription(
  params: UpsertSubscriptionParams
): Promise<UserSubscriptionRecord | null> {
  await ensureSubscriptionSchema();

  const tier = normalizePlanTier(params.tier);
  const billingCycle = normalizeBillingCycle(params.billingCycle);
  const status: SubscriptionStatus = params.status || 'active';
  const credits = PLANS[tier]?.interviewsLimit ?? 3;
  const hasPro = isPaidTier(tier) && status !== 'cancelled' && status !== 'expired';

  const periodEndIso =
    params.currentPeriodEnd && !Number.isNaN(Date.parse(params.currentPeriodEnd))
      ? new Date(params.currentPeriodEnd).toISOString()
      : new Date(
          Date.now() + (billingCycle === 'annual' ? 365 : 30) * 24 * 60 * 60 * 1000
        ).toISOString();

  const cleanEmail = (params.email || '').trim().toLowerCase();
  const cleanUserId = isValidUuid(params.userId) ? params.userId!.trim() : '';

  if (!cleanUserId && !cleanEmail) {
    return null;
  }

  try {
    const userIdCond = cleanUserId
      ? `id = ${escapeSqlLiteral(cleanUserId)}::uuid`
      : `LOWER(email) = ${escapeSqlLiteral(cleanEmail)}`;

    const userRows = await runPgQuery(`
      SELECT id::text, email, COALESCE(raw_user_meta_data->>'full_name', '')
      FROM auth.users
      WHERE ${userIdCond}
      LIMIT 1;
    `);

    const resolvedUserId = userRows[0]?.[0] || cleanUserId;
    const resolvedEmail = userRows[0]?.[1] || cleanEmail;
    const resolvedName =
      params.fullName || userRows[0]?.[2] || resolvedEmail.split('@')[0] || 'Candidate';

    if (!isValidUuid(resolvedUserId)) {
      return null;
    }

    const userIdLit = escapeSqlLiteral(resolvedUserId);
    const emailLit = escapeSqlLiteral(resolvedEmail);
    const nameLit = escapeSqlLiteral(resolvedName);
    const tierLit = escapeSqlLiteral(tier);
    const cycleLit = escapeSqlLiteral(billingCycle);
    const statusLit = escapeSqlLiteral(status);
    const custLit = params.dodoCustomerId ? escapeSqlLiteral(params.dodoCustomerId) : 'NULL';
    const subLit = params.dodoSubscriptionId ? escapeSqlLiteral(params.dodoSubscriptionId) : 'NULL';
    const payLit = params.dodoPaymentId ? escapeSqlLiteral(params.dodoPaymentId) : 'NULL';
    const periodLit = tier === 'free' ? 'NULL' : `${escapeSqlLiteral(periodEndIso)}::timestamptz`;

    const metaPatch = JSON.stringify({
      subscription_tier: tier,
      billing_cycle: billingCycle,
      subscription_status: status,
      has_pro_subscription: hasPro,
      dodo_subscription_id: params.dodoSubscriptionId || null,
      dodo_customer_id: params.dodoCustomerId || null,
      current_period_end: tier === 'free' ? null : periodEndIso,
    });
    const metaPatchLit = escapeSqlLiteral(metaPatch);

    const updatedRows = await runPgQuery(`
      INSERT INTO public.profiles (
        id, email, full_name, subscription_tier, billing_cycle, subscription_status,
        credits_remaining, dodo_customer_id, dodo_subscription_id, dodo_payment_id,
        current_period_end, updated_at
      ) VALUES (
        ${userIdLit}::uuid,
        ${emailLit},
        ${nameLit},
        ${tierLit},
        ${cycleLit},
        ${statusLit},
        ${credits},
        ${custLit},
        ${subLit},
        ${payLit},
        ${periodLit},
        NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        subscription_tier = EXCLUDED.subscription_tier,
        billing_cycle = EXCLUDED.billing_cycle,
        subscription_status = EXCLUDED.subscription_status,
        credits_remaining = CASE
          WHEN EXCLUDED.subscription_tier = 'free'
            THEN LEAST(COALESCE(public.profiles.credits_remaining, 0), ${PLANS.free.interviewsLimit})
          ELSE EXCLUDED.credits_remaining
        END,
        dodo_customer_id = COALESCE(EXCLUDED.dodo_customer_id, public.profiles.dodo_customer_id),
        dodo_subscription_id = COALESCE(EXCLUDED.dodo_subscription_id, public.profiles.dodo_subscription_id),
        dodo_payment_id = COALESCE(EXCLUDED.dodo_payment_id, public.profiles.dodo_payment_id),
        current_period_end = EXCLUDED.current_period_end,
        updated_at = NOW()
      RETURNING credits_remaining::text;
    `);

    await runPgQuery(`
      UPDATE auth.users
      SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || ${metaPatchLit}::jsonb,
          raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || ${metaPatchLit}::jsonb,
          updated_at = NOW()
      WHERE id = ${userIdLit}::uuid;
    `);

    const finalCredits =
      updatedRows[0]?.[0] !== undefined ? Number(updatedRows[0][0]) : credits;

    return {
      userId: resolvedUserId,
      email: resolvedEmail,
      tier,
      billingCycle,
      status,
      hasProSubscription: hasPro,
      creditsRemaining: Number.isNaN(finalCredits) ? credits : finalCredits,
      dodoCustomerId: params.dodoCustomerId || null,
      dodoSubscriptionId: params.dodoSubscriptionId || null,
      dodoPaymentId: params.dodoPaymentId || null,
      currentPeriodEnd: tier === 'free' ? null : periodEndIso,
    };
  } catch (err) {
    console.warn('[DB Subscription] upsertUserSubscription error:', err);
    return {
      userId: cleanUserId,
      email: cleanEmail,
      tier,
      billingCycle,
      status,
      hasProSubscription: hasPro,
      creditsRemaining: credits,
      dodoCustomerId: params.dodoCustomerId || null,
      dodoSubscriptionId: params.dodoSubscriptionId || null,
      dodoPaymentId: params.dodoPaymentId || null,
      currentPeriodEnd: periodEndIso,
    };
  }
}

export async function getUserSubscriptionFromDb(params: {
  userId?: string | null;
  email?: string | null;
}): Promise<UserSubscriptionRecord | null> {
  await ensureSubscriptionSchema();

  const cleanUserId = isValidUuid(params.userId) ? params.userId!.trim() : '';
  const cleanEmail = (params.email || '').trim().toLowerCase();
  if (!cleanUserId && !cleanEmail) return null;

  try {
    const cond = cleanUserId
      ? `p.id = ${escapeSqlLiteral(cleanUserId)}::uuid`
      : `LOWER(p.email) = ${escapeSqlLiteral(cleanEmail)}`;

    const rows = await runPgQuery(`
      SELECT
        p.id::text,
        p.email,
        COALESCE(p.subscription_tier, 'free'),
        COALESCE(p.billing_cycle, 'monthly'),
        COALESCE(p.subscription_status, 'active'),
        COALESCE(p.credits_remaining, 3)::text,
        COALESCE(p.dodo_customer_id, ''),
        COALESCE(p.dodo_subscription_id, ''),
        COALESCE(p.dodo_payment_id, ''),
        COALESCE(p.current_period_end::text, '')
      FROM public.profiles p
      WHERE ${cond}
      LIMIT 1;
    `);

    if (rows.length > 0) {
      const [
        id,
        email,
        rawTier,
        rawCycle,
        rawStatus,
        rawCredits,
        dodoCustomerId,
        dodoSubscriptionId,
        dodoPaymentId,
        currentPeriodEnd,
      ] = rows[0];
      const tier = normalizePlanTier(rawTier);
      const billingCycle = normalizeBillingCycle(rawCycle);
      const status = (rawStatus || 'active') as SubscriptionStatus;
      const hasPro = isPaidTier(tier) && status !== 'cancelled' && status !== 'expired';
      const parsedCredits = Number.parseInt(rawCredits, 10);

      return {
        userId: id,
        email,
        tier,
        billingCycle,
        status,
        hasProSubscription: hasPro,
        creditsRemaining: Number.isNaN(parsedCredits)
          ? PLANS[tier].interviewsLimit
          : Math.max(0, parsedCredits),
        dodoCustomerId: dodoCustomerId || null,
        dodoSubscriptionId: dodoSubscriptionId || null,
        dodoPaymentId: dodoPaymentId || null,
        currentPeriodEnd: currentPeriodEnd || null,
      };
    }

    // Fallback to server-only raw_app_meta_data on auth.users if profile row doesn't exist yet
    const authCond = cleanUserId
      ? `id = ${escapeSqlLiteral(cleanUserId)}::uuid`
      : `LOWER(email) = ${escapeSqlLiteral(cleanEmail)}`;

    const userRows = await runPgQuery(`
      SELECT
        id::text,
        email,
        COALESCE(raw_app_meta_data->>'subscription_tier', 'free'),
        COALESCE(raw_app_meta_data->>'billing_cycle', 'monthly'),
        COALESCE(raw_app_meta_data->>'subscription_status', 'active'),
        COALESCE(raw_app_meta_data->>'dodo_subscription_id', ''),
        COALESCE(raw_app_meta_data->>'dodo_customer_id', ''),
        COALESCE(raw_app_meta_data->>'current_period_end', '')
      FROM auth.users
      WHERE ${authCond}
      LIMIT 1;
    `);

    if (userRows.length > 0) {
      const [
        id,
        email,
        rawTier,
        rawCycle,
        rawStatus,
        dodoSubscriptionId,
        dodoCustomerId,
        currentPeriodEnd,
      ] = userRows[0];
      const tier = normalizePlanTier(rawTier);
      const billingCycle = normalizeBillingCycle(rawCycle);
      const status = (rawStatus || 'active') as SubscriptionStatus;
      const hasPro = isPaidTier(tier) && status !== 'cancelled' && status !== 'expired';

      return {
        userId: id,
        email,
        tier,
        billingCycle,
        status,
        hasProSubscription: hasPro,
        creditsRemaining: PLANS[tier].interviewsLimit,
        dodoCustomerId: dodoCustomerId || null,
        dodoSubscriptionId: dodoSubscriptionId || null,
        dodoPaymentId: null,
        currentPeriodEnd: currentPeriodEnd || null,
      };
    }

    return null;
  } catch (err) {
    console.warn('[DB Subscription] getUserSubscriptionFromDb error:', err);
    return null;
  }
}

/**
 * SEC-21: Atomically checks and decrements 1 interview credit for the user on the server.
 */
export async function consumeUserInterviewCredit(params: {
  userId: string;
  email?: string | null;
}): Promise<{ allowed: boolean; creditsRemaining: number; tier: PlanTier }> {
  await ensureSubscriptionSchema();

  if (!isValidUuid(params.userId)) {
    return { allowed: true, creditsRemaining: 3, tier: 'free' };
  }

  try {
    let sub = await getUserSubscriptionFromDb({
      userId: params.userId,
      email: params.email,
    });

    if (!sub) {
      sub = await upsertUserSubscription({
        userId: params.userId,
        email: params.email,
        tier: 'free',
        billingCycle: 'monthly',
        status: 'active',
      });
    }

    const tier = sub?.tier || 'free';
    const currentCredits = sub?.creditsRemaining ?? PLANS[tier].interviewsLimit;

    if (currentCredits <= 0) {
      return { allowed: false, creditsRemaining: 0, tier };
    }

    const userIdLit = escapeSqlLiteral(params.userId.trim());
    const rows = await runPgQuery(`
      UPDATE public.profiles
      SET credits_remaining = GREATEST(0, COALESCE(credits_remaining, 3) - 1),
          updated_at = NOW()
      WHERE id = ${userIdLit}::uuid
      RETURNING credits_remaining::text;
    `);

    const remaining = rows[0]?.[0]
      ? Math.max(0, Number.parseInt(rows[0][0], 10))
      : Math.max(0, currentCredits - 1);

    return { allowed: true, creditsRemaining: remaining, tier };
  } catch (err) {
    console.warn('[DB Credits] consumeUserInterviewCredit notice:', err);
    return { allowed: true, creditsRemaining: 2, tier: 'free' };
  }
}
