/**
 * 认证路由处理（完整流程，含 DB 操作的详细日志）
 */

import { buildAuthUrl, exchangeCodeForToken, fetchUserInfo, generateState } from '../oauth.js';

/**
 * 用户数据 upsert（存在则更新，不存在则插入） - 增强日志
 */
async function upsertUser(db, userInfo) {
    console.log('upsertUser START');
    console.log('userInfo:', JSON.stringify(userInfo, null, 2));
    console.log('userInfo.sub:', userInfo?.sub);

    if (!userInfo || !userInfo.sub) {
        throw new Error(`Invalid userInfo: missing sub field. userInfo=${JSON.stringify(userInfo)}`);
    }

    const now = new Date().toISOString();

    try {
        // 尝试查询
        console.log('Querying existing user...');
        const existing = await db.prepare(
            'SELECT * FROM users WHERE id = ?'
        ).bind(userInfo.sub).first();

        console.log('Existing user:', existing ? 'found' : 'not found');

        if (existing) {
            // 更新信息
            console.log('Updating user...');
            await db.prepare(
                `UPDATE users SET email = ?, name = ?, picture = ? WHERE id = ?`
            ).bind(userInfo.email, userInfo.name, userInfo.picture, userInfo.sub).run();
            console.log('User updated');
            return existing;
        } else {
            // 插入新用户
            console.log('Inserting new user...');
            await db.prepare(
                `INSERT INTO users (id, email, name, picture, created_at)
                 VALUES (?, ?, ?, ?, ?)`
            ).bind(userInfo.sub, userInfo.email, userInfo.name, userInfo.picture, now).run();
            console.log('User inserted');
            return {
                id: userInfo.sub,
                email: userInfo.email,
                name: userInfo.name,
                picture: userInfo.picture,
                created_at: now
            };
        }
    } catch (err) {
        console.error('upsertUser DB error:', err);
        throw err; // 重新抛出以便外层捕获
    }
}

/**
 * 生成 OAuth 入口路由
 */
export async function handleGoogleAuth(request, env, ctx) {
    try {
        console.log('=== handleGoogleAuth START ===');
        const url = new URL(request.url);
        const state = generateState();
        const redirectUri = 'https://auth.3dtag.shop/auth/google/callback';
        const authUrl = buildAuthUrl(redirectUri, state, env);
        const headers = new Headers({
            'Location': authUrl,
            'Set-Cookie': `oauth_state=${state}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600`
        });
        return new Response(null, { status: 302, headers });
    } catch (err) {
        console.error('handleGoogleAuth error:', err);
        return new Response(`OAuth start failed: ${err.message}`, { status: 500 });
    }
}

/**
 * 处理 OAuth 回调
 */
export async function handleGoogleCallback(request, env, ctx) {
    try {
        console.log('=== handleGoogleCallback START ===');
        const url = new URL(request.url);
        const code = url.searchParams.get('code');
        const state = url.searchParams.get('state');
        const error = url.searchParams.get('error');

        if (error) return new Response(`授权失败: ${error}`, { status: 400 });
        if (!code) return new Response('缺少授权码', { status: 400 });

        // 验证 state
        const cookieHeader = request.headers.get('Cookie') || '';
        const cookies = parseCookies(cookieHeader);
        const savedState = cookies.oauth_state;
        const clearStateCookie = 'oauth_state=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0';

        if (!savedState || savedState !== state) {
            return new Response('state 验证失败', { status: 400 })
                .headers.append('Set-Cookie', clearStateCookie);
        }

        console.log('OAuth callback: exchanging token...');
        const redirectUri = 'https://auth.3dtag.shop/auth/google/callback';
        const tokenData = await exchangeCodeForToken(code, redirectUri, env);
        const { access_token, expires_in } = tokenData;

        console.log('Fetching user info...');
        const userInfo = await fetchUserInfo(access_token);
        console.log('User info received:');
        console.log('  full object:', JSON.stringify(userInfo, null, 2));
        console.log('  sub:', userInfo?.sub);
        console.log('  email:', userInfo?.email);

        console.log('Upserting user to DB...');
        const user = await upsertUser(env.DB, userInfo);
        console.log('User upserted:', user?.id);

        // 创建 session
        console.log('Creating session...');
        const sessionId = generateSessionId();
        const expiresAt = new Date(Date.now() + expires_in * 1000).toISOString();

        console.log('Inserting session into DB...');
        console.log('Session params:', { sessionId, userId: user.id, expiresAt });

        await env.DB.prepare(
            `INSERT OR REPLACE INTO sessions (session_id, user_id, expires_at)
             VALUES (?, ?, ?)`
        ).bind(sessionId, user.id, expiresAt).run();

        console.log('Session inserted');

        // 设置会话 cookie
        const sessionCookie = `session=${sessionId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${expires_in}`;
        const redirectUrl = `/?logged_in=true`;
        const headers = new Headers({
            'Location': redirectUrl,
            'Set-Cookie': [sessionCookie, clearStateCookie].join('\n')
        });
        console.log('Redirecting to:', redirectUrl);
        return new Response(null, { status: 302, headers });

    } catch (err) {
        console.error('OAuth callback error:', err);
        console.error('Error stack:', err.stack);
        return new Response(`认证失败: ${err.message}`, { status: 500 })
            .headers.append('Set-Cookie', 'oauth_state=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');
    }
}

/**
 * 生成安全的 session ID
 */
function generateSessionId() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * 解析 Cookie 字符串
 */
export function parseCookies(cookieString) {
    const cookies = {};
    if (!cookieString) return cookies;
    cookieString.split(';').forEach(cookie => {
        const [key, value] = cookie.split('=').map(s => s.trim());
        if (key && value) {
            cookies[key] = decodeURIComponent(value);
        }
    });
    return cookies;
}
