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
    if (!userContainer) {
        console.error('AuthUI: .header-links container not found');
        return;
    }

    try {
        // 检查登录状态
        const result = await window.AuthClient?.getCurrentUser?.();
        const isAuthenticated = result?.authenticated === true;
        const userInfo = result?.user;

        if (isAuthenticated && userInfo) {
            renderUserAvatar(userContainer, userInfo);
            // 登录后，异步迁移本地历史到云端（如果云端没有）
            await migrateHistoryToCloud();
            // 通知应用加载云端数据（通过自定义事件）
            window.dispatchEvent(new CustomEvent('auth-login', { detail: { user: userInfo } }));
        } else {
            renderLoginButton(userContainer);
        }
    } catch (err) {
        console.error('AuthUI setup error:', err);
        // 出错时也显示登录按钮，确保用户能登录
        renderLoginButton(userContainer);
    }

    // 检查 OAuth callback 标识（URL 参数 logged_in）
    if (window.location.search.includes('logged_in=true')) {
        window.history.replaceState({}, document.title, window.location.pathname);
    }
}

function renderLoginButton(container) {
    container.innerHTML = `
        <button id="google-login-btn" class="btn btn-primary" style="display: inline-flex; align-items: center; gap: 6px;">
            <i class="fab fa-google"></i> 登录
        </button>
        <a href="https://github.com/firesoily/3Dtag" target="_blank" title="GitHub" style="display: inline-flex; align-items: center; margin-left: 12px; color: white; opacity: 0.9;">
            <i class="fab fa-github" style="font-size: 1.5rem;"></i>
        </a>
    `;

    const btn = document.getElementById('google-login-btn');
    if (btn) {
        btn.addEventListener('click', () => {
            window.AuthClient?.startOAuth?.();
        });
    }
}

function renderUserAvatar(container, user) {
    container.innerHTML = `
        <div class="user-menu" style="display: flex; align-items: center; gap: 12px;">
            <img src="${user.picture || 'https://via.placeholder.com/32'}"
                 alt="${user.name}"
                 class="user-avatar"
                 title="${user.email}"
                 style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;">
            <button id="logout-btn" class="btn btn-small" style="display: inline-flex; align-items: center; gap: 4px;">
                <i class="fas fa-sign-out-alt"></i> 退出
            </button>
            <a href="https://github.com/firesoily/3Dtag" target="_blank" title="GitHub" style="display: inline-flex; align-items: center; color: white; opacity: 0.9;">
                <i class="fab fa-github" style="font-size: 1.5rem;"></i>
            </a>
        </div>
    `;

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await window.AuthClient?.logout?.();
            window.location.reload();
        });
    }
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
