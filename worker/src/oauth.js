/**
 * Google OAuth 2.0 处理模块
 * 使用授权码流程 (Authorization Code Flow)
 */

const CLIENT_ID = getClientId();
const CLIENT_SECRET = getClientSecret();

// 从环境变量或 Cloudflare secrets 获取配置
function getClientId() {
    // wrangler secret 已设置，通过 env 访问
    if (typeof CLIENT_ID !== 'undefined') return CLIENT_ID;
    return '';
}

function getClientSecret() {
    if (typeof CLIENT_SECRET !== 'undefined') return CLIENT_SECRET;
    return '';
}

// Google OAuth 端点
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
 */
export function buildAuthUrl(redirectUri, state) {
    const params = new URLSearchParams({
        client_id: CLIENT_ID,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'openid email profile',
        access_type: 'offline',  // 获取 refresh token
        prompt: 'consent',       // 首次请求授权
        state: state
    });
    return `${GOOGLE_OAUTH.auth}?${params.toString()}`;
}

/**
 * 用授权码交换 token
 */
export async function exchangeCodeForToken(code, redirectUri) {
    const response = await fetch(GOOGLE_OAUTH.token, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
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
