/**
 * 认证路由处理（超简化版）
 */

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
        const state = crypto.randomUUID ? crypto.randomUUID().replace(/-/g, '').slice(0, 32) : 'randomstate';
        const redirectUri = 'https://auth.3dtag.shop/auth/google/callback';
        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(env.CLIENT_ID || '')}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=openid%20email%20profile&access_type=offline&prompt=consent&state=${state}`;
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
 * 处理 OAuth 回调 - 超简化版
 */
export async function handleGoogleCallback(request, env, ctx) {
    console.log('=== handleGoogleCallback START ===');
    console.log('request.url:', request.url);

    try {
        const url = new URL(request.url);
        console.log('URL parsed OK');

        const code = url.searchParams.get('code');
        const state = url.searchParams.get('state');
        const error = url.searchParams.get('error');

        console.log('params:', { code: code ? '***' : 'missing', state: state ? '***' : 'missing', error });

        if (error) return new Response(`授权失败: ${error}`, { status: 400 });
        if (!code) return new Response('缺少授权码', { status: 400 });

        // 验证 state
        const cookieHeader = request.headers.get('Cookie') || '';
        const cookies = parseCookies(cookieHeader);
        const savedState = cookies.oauth_state;
        const clearStateCookie = 'oauth_state=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0';

        console.log('State validation:', { savedState: savedState ? '***' : 'missing', received: state });
        if (!savedState || savedState !== state) {
            return new Response('state 验证失败', { status: 400 })
                .headers.append('Set-Cookie', clearStateCookie);
        }

        console.log('Validation passed, sending success redirect');
        const redirectUrl = `/?logged_in=true`;
        const headers = new Headers({
            'Location': redirectUrl,
            'Set-Cookie': clearStateCookie
        });
        return new Response(null, { status: 302, headers });

    } catch (err) {
        console.error('handleGoogleCallback error:', err);
        console.error('Error stack:', err.stack);
        return new Response(`认证失败: ${err.message}`, { status: 500 });
    }
}
