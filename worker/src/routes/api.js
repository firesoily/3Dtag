/**
 * API 路由处理
 * /api/user - 获取当前登录用户信息
 * /api/logout - 登出
 * /api/user-data - 获取/保存用户数据
 */

import { parseCookies } from './auth.js';

/**
 * API 路由分发器
 */
export async function handleApi(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/^\/api\//, '');

    switch (path) {
        case 'user':
            return handleGetUser(request, env);
        case 'logout':
            return handleLogout(request, env);
        case 'user-data':
            return handleUserData(request, env);
        default:
            return new Response('Not Found', { status: 404 });
    }
}

/**
 * GET /api/user - 获取当前用户信息
 */
async function handleGetUser(request, env) {
    const sessionId = getSessionId(request);
    if (!sessionId) {
        return new Response(JSON.stringify({ authenticated: false }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // 查询 sessions 表
    const session = await env.DB.prepare(
        `SELECT s.*, u.email, u.name, u.picture
         FROM sessions s
         JOIN users u ON s.user_id = u.id
         WHERE s.session_id = ? AND s.expires_at > ?`
    ).bind(sessionId, new Date().toISOString()).first();

    if (!session) {
        return new Response(JSON.stringify({ authenticated: false }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const userData = {
        authenticated: true,
        user: {
            id: session.user_id,
            email: session.email,
            name: session.name,
            picture: session.picture
        }
    };

    return new Response(JSON.stringify(userData), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
    });
}

/**
 * POST /api/logout - 登出
 */
async function handleLogout(request, env) {
    const sessionId = getSessionId(request);
    if (sessionId) {
        await env.DB.prepare('DELETE FROM sessions WHERE session_id = ?')
            .bind(sessionId).run();
    }

    const response = new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
    });

    // 清除 session cookie
    response.headers.append('Set-Cookie', 'session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');
    return response;
}

/**
 * GET|POST /api/user-data - 获取或保存用户数据
 * GET: ?key=xxx 获取单个
 * GET: 无 key 获取全部
 * POST: { key: 'xxx', value: any } 保存
 */
async function handleUserData(request, env) {
    const sessionId = getSessionId(request);
    if (!sessionId) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    // 获取 user_id
    const session = await env.DB.prepare(
        'SELECT user_id FROM sessions WHERE session_id = ? AND expires_at > ?'
    ).bind(sessionId, new Date().toISOString()).first();

    if (!session) {
        return new Response(JSON.stringify({ error: 'Invalid session' }), { status: 401 });
    }

    const userId = session.user_id;
    const url = new URL(request.url);
    const key = url.searchParams.get('key');

    if (request.method === 'GET') {
        if (key) {
            // 获取单个 key
            const record = await env.DB.prepare(
                'SELECT value FROM user_data WHERE user_id = ? AND key = ?'
            ).bind(userId, key).first();

            return new Response(JSON.stringify({
                key,
                value: record ? JSON.parse(record.value) : null
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        } else {
            // 获取所有 key-value
            const records = await env.DB.prepare(
                'SELECT key, value FROM user_data WHERE user_id = ?'
            ).bind(userId).all();

            const data = {};
            records.results.forEach(r => {
                data[r.key] = JSON.parse(r.value);
            });

            return new Response(JSON.stringify(data), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    }

    if (request.method === 'POST' || request.method === 'PUT') {
        const body = await request.json();
        const { key: postKey, value } = body;

        if (!postKey) {
            return new Response(JSON.stringify({ error: 'Key required' }), { status: 400 });
        }

        const jsonValue = JSON.stringify(value);

        await env.DB.prepare(
            `INSERT OR REPLACE INTO user_data (user_id, key, value)
             VALUES (?, ?, ?)`
        ).bind(userId, postKey, jsonValue).run();

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    if (request.method === 'DELETE') {
        if (!key) {
            return new Response(JSON.stringify({ error: 'Key required for delete' }), { status: 400 });
        }

        await env.DB.prepare('DELETE FROM user_data WHERE user_id = ? AND key = ?')
            .bind(userId, key).run();

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    return new Response('Method Not Allowed', { status: 405 });
}

/**
 * 从请求中提取 session ID
 */
function getSessionId(request) {
    const cookieHeader = request.headers.get('Cookie') || '';
    const cookies = parseCookies(cookieHeader);
    return cookies.session;
}
