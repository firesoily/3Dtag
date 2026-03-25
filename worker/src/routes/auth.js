/**
 * 认证路由处理（完整 OAuth，无 DB 操作）
 */

import { buildAuthUrl, exchangeCodeForToken, fetchUserInfo, generateState } from '../oauth.js';

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
 * 处理 OAuth 回调（含 token exchange + user info，无 DB）
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
            const response = new Response('state 验证失败', { status: 400 });
            response.headers.append('Set-Cookie', clearStateCookie);
            return response;
        }

        console.log('OAuth callback: exchanging token...');
        const redirectUri = 'https://auth.3dtag.shop/auth/google/callback';
        const tokenData = await exchangeCodeForToken(code, redirectUri, env);
        const { access_token, expires_in } = tokenData;
        console.log('Token exchange success, expires_in:', expires_in);
        console.log('expires_in type:', typeof expires_in, 'value:', expires_in);

        // 确保 expires_in 是正整数
        const maxAge = Math.max(0, Math.floor(expires_in || 3600));
        console.log('Using maxAge:', maxAge);

        console.log('Fetching user info...');
        const userInfo = await fetchUserInfo(access_token);
        console.log('User info received:', { email: userInfo?.email, sub: userInfo?.sub });

        console.log('SKIPPING DB operations - test mode');
        const sessionId = Math.random().toString(36).substring(2);
        const sessionCookie = `session=${sessionId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`;
        // 重定向到主站（3dtag.shop），带上登录标识
        const redirectUrl = `https://3dtag.shop/?logged_in=true`;

        console.log('Creating response with headers...');
        const headers = new Headers();
        headers.append('Location', redirectUrl);
        headers.append('Set-Cookie', sessionCookie);
        headers.append('Set-Cookie', clearStateCookie);

        console.log('Redirecting to:', redirectUrl);
        return new Response(null, { status: 302, headers });

    } catch (err) {
        console.error('OAuth callback error:', err);
        console.error('Error stack:', err.stack);
        const response = new Response(`认证失败: ${err.message}`, { status: 500 });
        response.headers.append('Set-Cookie', 'oauth_state=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');
        return response;
    }
}
