import { NextResponse } from 'next/server';
import tls from 'tls';
import net from 'net';
import crypto from 'crypto';

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

function runPgQuery(sql: string): Promise<string[][]> {
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

function escapeSqlLiteral(val: string): string {
  return "'" + val.replace(/'/g, "''") + "'";
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const action = body?.action as 'confirm' | 'ensure_signup';
    const rawEmail = (body?.email || '').trim().toLowerCase();
    const password = body?.password || '';
    const fullName = (body?.name || rawEmail.split('@')[0] || 'Candidate').trim();

    if (!rawEmail || !rawEmail.includes('@')) {
      return NextResponse.json({ ok: false, error: 'Valid email is required' }, { status: 400 });
    }

    const emailLit = escapeSqlLiteral(rawEmail);

    if (action === 'confirm') {
      // Confirm unconfirmed email and, if it's an OAuth-only account with no password yet, set the provided password
      const pwdSql = password
        ? `, encrypted_password = CASE WHEN encrypted_password IS NULL OR encrypted_password = '' THEN extensions.crypt(${escapeSqlLiteral(
            password
          )}, extensions.gen_salt('bf')) ELSE encrypted_password END`
        : '';

      await runPgQuery(`
        UPDATE auth.users
        SET email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
            updated_at = NOW()
            ${pwdSql}
        WHERE LOWER(email) = ${emailLit};
      `);

      return NextResponse.json({ ok: true });
    }

    if (action === 'ensure_signup' && password) {
      const pwdLit = escapeSqlLiteral(password);
      const nameJsonLit = escapeSqlLiteral(JSON.stringify({ full_name: fullName }));

      await runPgQuery(`
        DO $$
        DECLARE
          v_user_id uuid;
        BEGIN
          SELECT id INTO v_user_id FROM auth.users WHERE LOWER(email) = ${emailLit};
          IF v_user_id IS NULL THEN
            v_user_id := gen_random_uuid();
            INSERT INTO auth.users (
              instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
              raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
              confirmation_token, email_change, email_change_token_new, recovery_token
            ) VALUES (
              '00000000-0000-0000-0000-000000000000',
              v_user_id,
              'authenticated',
              'authenticated',
              ${emailLit},
              extensions.crypt(${pwdLit}, extensions.gen_salt('bf')),
              NOW(),
              '{"provider":"email","providers":["email"]}'::jsonb,
              ${nameJsonLit}::jsonb,
              NOW(),
              NOW(),
              '', '', '', ''
            );

            INSERT INTO auth.identities (
              id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
            ) VALUES (
              gen_random_uuid(),
              v_user_id,
              v_user_id::text,
              jsonb_build_object('sub', v_user_id::text, 'email', ${emailLit}, 'email_verified', true, 'phone_verified', false),
              'email',
              NOW(),
              NOW(),
              NOW()
            );
          ELSE
            UPDATE auth.users
            SET email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
                updated_at = NOW()
            WHERE id = v_user_id;
          END IF;
        END $$;
      `);

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: false, error: 'Unsupported action' }, { status: 400 });
  } catch (err: any) {
    console.warn('[Auth Assist] Notice:', err?.message || err);
    return NextResponse.json({ ok: false, error: err?.message || 'Assist error' }, { status: 500 });
  }
}
