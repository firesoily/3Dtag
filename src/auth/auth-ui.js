/**
 * 3Dtag Auth UI - Global Version
 * 自动初始化，挂载到 window.AuthUI
 */

window.AuthUI = {
    init: init
};

async function init() {
    // 等待 DOM 加载
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setup);
    } else {
        setup();
    }
}

async function setup() {
    const userContainer = document.querySelector('.header-links');
    if (!userContainer) return;

    // 检查登录状态
    const result = await window.AuthClient.getCurrentUser();
    const isAuthenticated = result.authenticated;
    const userInfo = result.user;

    if (isAuthenticated) {
        renderUserAvatar(userContainer, userInfo);
        // 登录后，异步迁移本地历史到云端（如果云端没有）
        await migrateHistoryToCloud();
        // 通知应用加载云端数据（通过自定义事件）
        window.dispatchEvent(new CustomEvent('auth-login', { detail: { user: userInfo } }));
    } else {
        renderLoginButton(userContainer);
    }

    // 检查 OAuth callback 标识（URL 参数 logged_in）
    if (window.location.search.includes('logged_in=true')) {
        window.history.replaceState({}, document.title, window.location.pathname);
    }
}

function renderLoginButton(container) {
    container.innerHTML = `
        <button id="google-login-btn" class="btn btn-primary">
            <i class="fab fa-google"></i> 登录
        </button>
        <a href="https://github.com/firesoily/3Dtag" target="_blank" title="GitHub">
            <i class="fab fa-github"></i>
        </a>
    `;

    document.getElementById('google-login-btn').addEventListener('click', () => {
        window.AuthClient.startOAuth();
    });
}

function renderUserAvatar(container, user) {
    container.innerHTML = `
        <div class="user-menu">
            <img src="${user.picture || 'https://via.placeholder.com/32'}"
                 alt="${user.name}"
                 class="user-avatar"
                 title="${user.email}">
            <button id="logout-btn" class="btn btn-small">
                <i class="fas fa-sign-out-alt"></i> 退出
            </button>
            <a href="https://github.com/firesoily/3Dtag" target="_blank" title="GitHub">
                <i class="fab fa-github"></i>
            </a>
        </div>
    `;

    document.getElementById('logout-btn').addEventListener('click', async () => {
        await window.AuthClient.logout();
        window.location.reload();
    });
}

/**
 * 迁移本地历史到云端（登录后执行一次）
 */
async function migrateHistoryToCloud() {
    const localHistory = localStorage.getItem('3dtag-history');
    if (!localHistory) return;

    try {
        const history = JSON.parse(localHistory);
        if (!Array.isArray(history) || history.length === 0) return;

        const cloudHistory = await window.AuthClient.getUserData('history');
        if (cloudHistory && Array.isArray(cloudHistory) && cloudHistory.length > 0) {
            return; // 云端已有历史
        }

        await window.AuthClient.saveUserData('history', history);
        console.log(`Migrated ${history.length} history records to cloud`);
    } catch (err) {
        console.error('Failed to migrate history:', err);
    }
}
