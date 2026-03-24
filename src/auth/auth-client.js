/**
 * 3Dtag Auth Client - Global Version
 * 挂载到 window.AuthClient
 */

// Temporary: using workers.dev subdomain while DNS propagates
const AUTH_WORKER_URL = 'https://3dtag-auth-production.fenjohn466.workers.dev';

window.AuthClient = {
    getCurrentUser,
    logout,
    getUserData,
    saveUserData,
    startOAuth
};

/**
 * 获取当前用户状态
 */
async function getCurrentUser() {
    try {
        const response = await fetch(`${AUTH_WORKER_URL}/api/user`, {
            credentials: 'include'
        });
        return await response.json();
    } catch (err) {
        console.error('Auth API error:', err);
        return { authenticated: false };
    }
}

/**
 * 登出
 */
async function logout() {
    try {
        const response = await fetch(`${AUTH_WORKER_URL}/api/logout`, {
            method: 'POST',
            credentials: 'include'
        });
        return await response.json();
    } catch (err) {
        console.error('Logout error:', err);
        return { success: false };
    }
}

/**
 * 获取用户数据
 */
async function getUserData(key) {
    const url = key
        ? `${AUTH_WORKER_URL}/api/user-data?key=${encodeURIComponent(key)}`
        : `${AUTH_WORKER_URL}/api/user-data`;

    try {
        const response = await fetch(url, {
            credentials: 'include'
        });
        if (key) {
            const result = await response.json();
            return result.value;
        }
        return await response.json();
    } catch (err) {
        console.error('Get user data error:', err);
        return key ? null : {};
    }
}

/**
 * 保存用户数据
 */
async function saveUserData(key, value) {
    try {
        const response = await fetch(`${AUTH_WORKER_URL}/api/user-data`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ key, value })
        });
        return await response.json();
    } catch (err) {
        console.error('Save user data error:', err);
        return { success: false };
    }
}

/**
 * 启动 OAuth
 */
function startOAuth() {
    window.location.href = `${AUTH_WORKER_URL}/auth/google`;
}
