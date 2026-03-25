/**
 * 认证路由处理（仅 DB 操作被简化）
 */

import { buildAuthUrl, exchangeCodeForToken, fetchUserInfo, generateState } from '../oauth.js';

/**
 * 极简 upsertUser（模拟成功）
 */
async function upsertUser(db, userInfo) {
    console.log('upsertUser called with:', userInfo);
    // 直接返回对象，不操作 DB
    return { id: userInfo.sub, email: userInfo.email, name: userInfo.name, picture: userInfo.picture };
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
 * 处理 OAuth 回调（包含 upsertUser 调用）
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
        console.log('User info received:', userInfo?.email);

        console.log('Upserting user (simulated)...');
        const user = await upsertUser(env.DB, userInfo);
        console.log('User upserted:', user?.id);

        // 创建 session
        const sessionId = generateSessionId();
        const expiresAt = new Date(Date.now() + expires_in * 1000).toISOString();

        // 暂时注释掉 DB insert
        // await env.DB.prepare(`INSERT INTO sessions ...`).bind(...).run();

        console.log('Session created (simulated):', sessionId);
        const sessionCookie = `session=${sessionId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${expires_in}`;
        const redirectUrl = `/?logged_in=true`;
        const headers = new Headers({
            'Location': redirectUrl,
            'Set-Cookie': [sessionCookie, clearStateCookie].join('\n')
        });
        return new Response(null, { status: 302, headers });

    } catch (err) {
        console.error('OAuth callback error:', err);
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
