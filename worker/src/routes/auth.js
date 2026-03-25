/**
 * 认证路由处理
 * /auth/google - 启动 OAuth
 * /auth/google/callback - OAuth 回调
 */

import { buildAuthUrl, exchangeCodeForToken, fetchUserInfo, generateState } from '../oauth.js';

/**
 * 生成 OAuth 入口路由
 */
export async function handleGoogleAuth(request, env, ctx) {
    console.log('=== handleGoogleAuth START ===');
    console.log('env keys:', env ? Object.keys(env).join(', ') : 'env is falsy');
    console.log('CLIENT_ID present:', !!env?.CLIENT_ID);
    console.log('CLIENT_SECRET present:', !!env?.CLIENT_SECRET);

    try {
        const url = new URL(request.url);
        console.log('Request URL:', url.href);

        // 生成 state 并存入 KV（或 Cookie）用于回调验证
        const state = generateState();
        console.log('Generated state length:', state.length);

        // 临时存储 state（使用 KV namespace，需要先绑定）
        // 简化版：将 state 嵌入重定向 URL 参数，实际生产建议用 KV 或 signed cookie
        const redirectUri = 'https://auth.3dtag.shop/auth/google/callback';
        console.log('Redirect URI:', redirectUri);

        const authUrl = buildAuthUrl(redirectUri, state, env);
        console.log('Auth URL:', authUrl);

        // 将 state 通过 cookie 传递（临时方案）
        // 注意：不能直接修改 Response.redirect() 的 headers，需要创建新 Response
        const headers = new Headers({
            'Location': authUrl,
            'Set-Cookie': `oauth_state=${state}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600`
        });
        console.log('=== handleGoogleAuth SUCCESS ===');
        return new Response(null, { status: 302, headers });

    } catch (err) {
        console.error('=== handleGoogleAuth ERROR ===');
        console.error('Error name:', err.name);
        console.error('Error message:', err.message);
        console.error('Error stack:', err.stack);
        // 返回详细错误（调试用）
        return new Response(`OAuth start failed: ${err.name}: ${err.message}\n\nStack:\n${err.stack || 'N/A'}`, {
            status: 500,
            headers: { 'Content-Type': 'text/plain' }
        });
    }
}

/**
 * 处理 OAuth 回调
 */
export async function handleGoogleCallback(request, env, ctx) {
    console.log('=== handleGoogleCallback START ===');
    console.log('env keys:', env ? Object.keys(env).join(', ') : 'env is falsy');
    console.log('CLIENT_ID present:', !!env?.CLIENT_ID);
    console.log('CLIENT_SECRET present:', !!env?.CLIENT_SECRET);

    try {
        const url = new URL(request.url);
        console.log('Request URL:', url.href);

        const code = url.searchParams.get('code');
        const state = url.searchParams.get('state');
        const error = url.searchParams.get('error');

        console.log('OAuth callback received:', { code: code ? '***' : 'missing', state: state ? 'present' : 'missing', error });

        // 检查 OAuth 错误
        if (error) {
            return new Response(`授权失败: ${error}`, { status: 400 });
        }

        if (!code) {
            return new Response('缺少授权码', { status: 400 });
        }

        // 验证 state（从 cookie 读取）
        const cookieHeader = request.headers.get('Cookie') || '';
        const cookies = parseCookies(cookieHeader);
        const savedState = cookies.oauth_state;

        console.log('State validation:', { savedState: savedState ? 'present' : 'missing', state: state ? 'present' : 'missing', match: savedState === state });

        // 清除 state cookie
        const clearStateCookie = 'oauth_state=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0';

        if (!savedState || savedState !== state) {
            return new Response('state 验证失败', { status: 400 })
                .headers.append('Set-Cookie', clearStateCookie);
        }

        console.log('OAuth callback: exchanging token...');
        // 交换 token
        const redirectUri = 'https://auth.3dtag.shop/auth/google/callback';
        const tokenData = await exchangeCodeForToken(code, redirectUri, env);

        const { access_token, id_token, refresh_token, expires_in } = tokenData;
        console.log('Token exchange success, expires_in:', expires_in);

        // 获取用户信息
        console.log('Fetching user info...');
        const userInfo = await fetchUserInfo(access_token);
        console.log('User info:', userInfo?.sub, userInfo?.email);

        // 查询或创建用户
        console.log('Upserting user to DB...');
        const user = await upsertUser(env.DB, userInfo);
        console.log('User upserted:', user?.id);

        // 创建会话（session）
        const sessionId = generateSessionId();
        const expiresAt = new Date(Date.now() + expires_in * 1000).toISOString();

        await env.DB.prepare(
            `INSERT OR REPLACE INTO sessions (session_id, user_id, expires_at)
             VALUES (?, ?, ?)`
        ).bind(sessionId, user.id, expiresAt).run();

        console.log('Session created:', sessionId);

        // 设置会话 cookie（HTTP-only）
        const sessionCookie = `session=${sessionId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${expires_in}`;

        // 重定向回前端首页（带上登录成功标识）
        // 同样不能直接修改 Response.redirect() 的 headers
        const redirectUrl = `/?logged_in=true`;
        const headers = new Headers({
            'Location': redirectUrl,
            'Set-Cookie': [sessionCookie, clearStateCookie].join('\n')
        });
        console.log('Redirecting to:', redirectUrl);
        return new Response(null, { status: 302, headers });

    } catch (err) {
        console.error('OAuth callback error:', err);
        return new Response(`认证失败: ${err.message}`, { status: 500 })
            .headers.append('Set-Cookie', 'oauth_state=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');
    }
}
    if (error) {
        return new Response(`授权失败: ${error}`, { status: 400 });
    }

    if (!code) {
        return new Response('缺少授权码', { status: 400 });
    }

    // 验证 state（从 cookie 读取）
    const cookieHeader = request.headers.get('Cookie') || '';
    const cookies = parseCookies(cookieHeader);
    const savedState = cookies.oauth_state;

    console.log('State validation:', { savedState: savedState ? 'present' : 'missing', state: state ? 'present' : 'missing', match: savedState === state });

    // 清除 state cookie
    const clearStateCookie = 'oauth_state=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0';

    if (!savedState || savedState !== state) {
        return new Response('state 验证失败', { status: 400 })
            .headers.append('Set-Cookie', clearStateCookie);
    }

    try {
        console.log('OAuth callback: exchanging token...');
        // 交换 token
        const redirectUri = 'https://auth.3dtag.shop/auth/google/callback';
        const tokenData = await exchangeCodeForToken(code, redirectUri, env);

        const { access_token, id_token, refresh_token, expires_in } = tokenData;
        console.log('Token exchange success, expires_in:', expires_in);

        // 获取用户信息
        console.log('Fetching user info...');
        const userInfo = await fetchUserInfo(access_token);
        console.log('User info:', userInfo?.sub, userInfo?.email);

        // 查询或创建用户
        console.log('Upserting user to DB...');
        const user = await upsertUser(env.DB, userInfo);
        console.log('User upserted:', user?.id);

        // 创建会话（session）
        const sessionId = generateSessionId();
        const expiresAt = new Date(Date.now() + expires_in * 1000).toISOString();

        await env.DB.prepare(
            `INSERT OR REPLACE INTO sessions (session_id, user_id, expires_at)
             VALUES (?, ?, ?)`
        ).bind(sessionId, user.id, expiresAt).run();

        console.log('Session created:', sessionId);

        // 设置会话 cookie（HTTP-only）
        const sessionCookie = `session=${sessionId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${expires_in}`;

        // 重定向回前端首页（带上登录成功标识）
        // 同样不能直接修改 Response.redirect() 的 headers
        const redirectUrl = `/?logged_in=true`;
        const headers = new Headers({
            'Location': redirectUrl,
            'Set-Cookie': [sessionCookie, clearStateCookie].join('\n')
        });
        console.log('Redirecting to:', redirectUrl);
        return new Response(null, { status: 302, headers });

    } catch (err) {
        console.error('OAuth callback error:', err);
        return new Response(`认证失败: ${err.message}`, { status: 500 })
            .headers.append('Set-Cookie', clearStateCookie);
    }
}

/**
 * 用户数据 upsert（存在则更新，不存在则插入）
 */
async function upsertUser(db, userInfo) {
    const now = new Date().toISOString();

    // 尝试查询
    const existing = await db.prepare(
        'SELECT * FROM users WHERE id = ?'
    ).bind(userInfo.sub).first();

    if (existing) {
        // 更新信息
        await db.prepare(
            `UPDATE users SET email = ?, name = ?, picture = ? WHERE id = ?`
        ).bind(userInfo.email, userInfo.name, userInfo.picture, userInfo.sub).run();
        return existing;
    } else {
        // 插入新用户
        await db.prepare(
            `INSERT INTO users (id, email, name, picture, created_at)
             VALUES (?, ?, ?, ?, ?)`
        ).bind(userInfo.sub, userInfo.email, userInfo.name, userInfo.picture, now).run();
        return {
            id: userInfo.sub,
            email: userInfo.email,
            name: userInfo.name,
            picture: userInfo.picture,
            created_at: now
        };
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
