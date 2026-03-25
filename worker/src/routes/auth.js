/**
 * 认证路由处理（完整版，含真实 DB 操作）
 */

import { buildAuthUrl, exchangeCodeForToken, fetchUserInfo, generateState } from '../oauth.js';

/**
 * 存储 state 到 KV（如果可用）或回退到 cookie
 */
async function storeState(env, state) {
    const clearStateCookie = 'oauth_state=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0';
    
    // 尝试存储到 KV（优先）
    if (env.STATE_KV) {
        try {
            await env.STATE_KV.put(state, '1', { expirationTtl: 600 }); // 10 分钟 TTL
            console.log('State stored in KV:', state);
            // KV 存储成功，不需要 cookie，但为了兼容性仍设置（但不依赖）
            return { cookie: clearStateCookie, useKv: true };
        } catch (err) {
            console.warn('KV store failed, falling back to cookie:', err);
        }
    }
    
    // 降级：使用 cookie 存储
    console.log('State stored in cookie (KV not available or failed)');
    return { cookie: `oauth_state=${state}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600`, useKv: false };
}

/**
 * 验证 state：先查 KV，不存在则验证 cookie
 */
async function verifyState(env, expectedState, cookieHeader) {
    // 1. 尝试从 KV 验证（最安全）
    if (env.STATE_KV) {
        try {
            const stored = await env.STATE_KV.get(expectedState);
            if (stored !== null) {
                // 验证通过，立即删除（一次性）
                await env.STATE_KV.delete(expectedState);
                console.log('State verified from KV and deleted:', expectedState);
                return { valid: true, clearCookie: '' };
            }
        } catch (err) {
            console.warn('KV get failed, falling back to cookie:', err);
        }
    }
    
    // 2. 降级：验证 cookie
    const cookies = parseCookies(cookieHeader);
    const savedState = cookies.oauth_state;
    const clearStateCookie = 'oauth_state=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0';
    
    if (savedState && savedState === expectedState) {
        console.log('State verified from cookie:', expectedState);
        return { valid: true, clearCookie: clearStateCookie };
    }
    
    console.log('State verification failed:', { expected: expectedState, saved: savedState });
    return { valid: false, clearCookie: clearStateCookie };
}

/**
 * 生成安全随机会话 ID
 */
function generateSessionId() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * 用户数据 upsert（存在则更新，不存在则插入）
 */
async function upsertUser(db, userInfo) {
    console.log('upsertUser START');
    console.log('userInfo:', JSON.stringify(userInfo, null, 2));

    if (!userInfo || !userInfo.sub) {
        throw new Error(`Invalid userInfo: missing sub field. userInfo=${JSON.stringify(userInfo)}`);
    }

    const now = new Date().toISOString();

    try {
        // 尝试查询现有用户
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
        throw err;
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
        
        // 存储 state（优先 KV，失败则降级到 cookie）
        const { cookie: stateCookie } = await storeState(env, state);
        
        const headers = new Headers();
        headers.append('Location', authUrl);
        if (stateCookie) {
            headers.append('Set-Cookie', stateCookie);
        }
        
        console.log('OAuth start: state stored, redirecting to Google');
        return new Response(null, { status: 302, headers });
    } catch (err) {
        console.error('handleGoogleAuth error:', err);
        return new Response(`OAuth start failed: ${err.message}`, { status: 500 });
    }
}

/**
 * 处理 OAuth 回调（含真实 DB 操作）
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

        // 确保 expires_in 为正整数
        const maxAge = Math.max(0, Math.floor(expires_in || 3600));

        console.log('Fetching user info...');
        const userInfo = await fetchUserInfo(access_token);
        console.log('User info received:', { email: userInfo?.email, sub: userInfo?.sub });

        console.log('Upserting user to DB...');
        const user = await upsertUser(env.DB, userInfo);
        console.log('User upserted:', user?.id);

        // 创建 session 并插入数据库
        console.log('Creating session...');
        const sessionId = generateSessionId();
        const expiresAt = new Date(Date.now() + maxAge * 1000).toISOString();

        console.log('Inserting session into DB...');
        console.log('Session params:', { sessionId, userId: user.id, expiresAt });

        await env.DB.prepare(
            `INSERT OR REPLACE INTO sessions (session_id, user_id, expires_at)
             VALUES (?, ?, ?)`
        ).bind(sessionId, user.id, expiresAt).run();

        console.log('Session inserted');

        // 设置会话 cookie 并重定向到主站
        const sessionCookie = `session=${sessionId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`;
        const redirectUrl = `https://3dtag.shop/?logged_in=true`;

        const response = new Response(null, { status: 302, headers: new Headers() });
        response.headers.append('Location', redirectUrl);
        response.headers.append('Set-Cookie', sessionCookie);
        response.headers.append('Set-Cookie', clearStateCookie);

        console.log('Redirecting to:', redirectUrl);
        return response;

    } catch (err) {
        console.error('OAuth callback error:', err);
        console.error('Error stack:', err.stack);
        const response = new Response(`认证失败: ${err.message}`, { status: 500 });
        response.headers.append('Set-Cookie', 'oauth_state=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');
        return response;
    }
}
