/**
 * Google OAuth 2.0 处理模块（增强日志）
 */

const GOOGLE_OAUTH = {
    auth: 'https://accounts.google.com/o/oauth2/v2/auth',
    token: 'https://oauth2.googleapis.com/token',
    userinfo: 'https://www.googleapis.com/oauth2/v3/userinfo'
};

export function generateState() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

export function buildAuthUrl(redirectUri, state, env) {
    const clientId = env?.CLIENT_ID || '';
    console.log('buildAuthUrl: CLIENT_ID present:', !!env?.CLIENT_ID);
    const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'openid email profile',
        access_type: 'offline',
        prompt: 'consent',
        state
    });
    return `${GOOGLE_OAUTH.auth}?${params.toString()}`;
}

export async function exchangeCodeForToken(code, redirectUri, env) {
    try {
        console.log('exchangeCodeForToken START');
        console.log('env.CLIENT_ID:', env?.CLIENT_ID ? '***' : 'MISSING');
        console.log('env.CLIENT_SECRET:', env?.CLIENT_SECRET ? '***' : 'MISSING');
        console.log('code:', code ? '***' : 'missing');
        console.log('redirectUri:', redirectUri);

        const body = new URLSearchParams({
            client_id: env.CLIENT_ID || '',
            client_secret: env.CLIENT_SECRET || '',
            code,
            grant_type: 'authorization_code',
            redirect_uri: redirectUri
        });
        console.log('Request body:', body.toString().replace(/(client_secret=.+?)(&|$)/, 'client_secret=***$1'));

        const response = await fetch(GOOGLE_OAUTH.token, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body
        });

        console.log('Token exchange response status:', response.status);
        const text = await response.text();
        console.log('Token exchange response body (truncated):', text.substring(0, 500));

        if (!response.ok) {
            throw new Error(`Token exchange failed: ${response.status} - ${text.substring(0, 200)}`);
        }

        const data = JSON.parse(text);
        console.log('Token exchange success, keys:', Object.keys(data));
        return data;

    } catch (err) {
        console.error('exchangeCodeForToken error:', err);
        throw err;
    }
}

export async function fetchUserInfo(accessToken) {
    try {
        console.log('fetchUserInfo START');
        console.log('accessToken:', accessToken ? `${accessToken.substring(0, 20)}...` : 'MISSING');

        const response = await fetch(GOOGLE_OAUTH.userinfo, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        console.log('User info response status:', response.status);
        const text = await response.text();
        console.log('User info response body (truncated):', text.substring(0, 500));

        if (!response.ok) {
            throw new Error(`Failed to fetch user info: ${response.status} - ${text.substring(0, 200)}`);
        }

        const data = JSON.parse(text);
        console.log('User info parsed, keys:', Object.keys(data));
        return data;

    } catch (err) {
        console.error('fetchUserInfo error:', err);
        throw err;
    }
}
