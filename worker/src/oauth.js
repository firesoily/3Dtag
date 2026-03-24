/**
 * Google OAuth 2.0 处理模块
 * 使用授权码流程 (Authorization Code Flow)
 */

// Google OAuth 端点（常量）
const GOOGLE_OAUTH = {
    auth: 'https://accounts.google.com/o/oauth2/v2/auth',
    token: 'https://oauth2.googleapis.com/token',
    userinfo: 'https://www.googleapis.com/oauth2/v3/userinfo'
};

/**
 * 生成 state 参数（防 CSRF）
 */
export function generateState() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * 构建 Google OAuth URL
 * @param {string} redirectUri - 回调地址
 * @param {string} state - CSRF state token
 * @param {object} env - Worker environment (包含 secrets)
 */
export function buildAuthUrl(redirectUri, state, env) {
    const clientId = env.CLIENT_ID || '';
    const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'openid email profile',
        access_type: 'offline',
        prompt: 'consent',
        state: state
    });
    return `${GOOGLE_OAUTH.auth}?${params.toString()}`;
}

/**
 * 用授权码交换 token
 * @param {string} code - 授权码
 * @param {string} redirectUri - 回调地址（必须与 Google Console 一致）
 * @param {object} env - Worker environment (包含 secrets)
 */
export async function exchangeCodeForToken(code, redirectUri, env) {
    const response = await fetch(GOOGLE_OAUTH.token, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
            client_id: env.CLIENT_ID || '',
            client_secret: env.CLIENT_SECRET || '',
            code: code,
            grant_type: 'authorization_code',
            redirect_uri: redirectUri
        })
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Token exchange failed: ${response.status} - ${error}`);
    }

    return await response.json();
}

/**
 * 用 access_token 获取用户信息
 */
export async function fetchUserInfo(accessToken) {
    const response = await fetch(GOOGLE_OAUTH.userinfo, {
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch user info: ${response.status}`);
    }

    return await response.json();
}
