/**
 * 错误页面生成器
 * 生成美观、信息丰富的错误响应
 */

/**
 * 根据错误信息生成用户友好的错误页面
 * @param {number} status - HTTP 状态码
 * @param {string} message - 错误消息（用户可读）
 * @param {object} details - 调试详情（仅开发环境显示）
 * @param {string} [env='production'] - 环境类型，决定是否显示调试信息
 * @returns {Response}
 */
export function createErrorPage(status, message, details = {}, env = 'production') {
    const isDev = env === 'development';
    const title = getErrorTitle(status);
    const color = getStatusColor(status);
    
    // 构建页面 HTML
    let html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - 3Dtag</title>
    <style>
        :root {
            --primary: #6366f1;
            --bg: #0f172a;
            --card: #1e293b;
            --text: #e2e8f0;
            --text-muted: #94a3b8;
            --error: ${color};
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background: var(--bg);
            color: var(--text);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .container {
            background: var(--card);
            border-radius: 16px;
            padding: 40px;
            max-width: 600px;
            width: 100%;
            box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
            border: 1px solid rgba(255,255,255,0.1);
        }
        .header {
            display: flex;
            align-items: center;
            gap: 16px;
            margin-bottom: 24px;
        }
        .icon {
            width: 64px;
            height: 64px;
            background: ${color}20;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 28px;
        }
        h1 {
            font-size: 28px;
            font-weight: 700;
            color: var(--text);
        }
        .status-badge {
            background: ${color}30;
            color: ${color};
            padding: 4px 12px;
            border-radius: 999px;
            font-size: 14px;
            font-weight: 600;
            margin-left: auto;
        }
        .message {
            font-size: 16px;
            line-height: 1.6;
            color: var(--text-muted);
            margin-bottom: 32px;
            padding: 16px;
            background: rgba(0,0,0,0.2);
            border-radius: 8px;
            border-left: 3px solid var(--error);
        }
        .actions {
            display: flex;
            gap: 12px;
            flex-wrap: wrap;
        }
        .btn {
            padding: 12px 24px;
            border-radius: 8px;
            font-weight: 600;
            text-decoration: none;
            transition: all 0.2s;
            border: none;
            cursor: pointer;
            font-size: 14px;
        }
        .btn-primary {
            background: var(--primary);
            color: white;
        }
        .btn-primary:hover {
            background: #4f46e5;
            transform: translateY(-1px);
        }
        .btn-secondary {
            background: rgba(255,255,255,0.1);
            color: var(--text);
            border: 1px solid rgba(255,255,255,0.2);
        }
        .btn-secondary:hover {
            background: rgba(255,255,255,0.15);
        }
        .debug {
            margin-top: 32px;
            padding: 16px;
            background: #00000040;
            border-radius: 8px;
            font-family: monospace;
            font-size: 12px;
            color: var(--text-muted);
            overflow-x: auto;
            display: none;
        }
        .debug.show { display: block; }
        .debug h3 {
            color: var(--text);
            margin-bottom: 8px;
            font-size: 14px;
        }
        .debug pre {
            white-space: pre-wrap;
            word-wrap: break-word;
        }
        @media (max-width: 600px) {
            .container { padding: 24px; }
            h1 { font-size: 22px; }
            .header { flex-direction: column; text-align: center; }
            .status-badge { margin-left: 0; margin-top: 8px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="icon">${getStatusIcon(status)}</div>
            <div>
                <h1>${title}</h1>
                <span class="status-badge">HTTP ${status}</span>
            </div>
        </div>
        <div class="message">${escapeHtml(message)}</div>
        <div class="actions">
            <a href="/" class="btn btn-primary">返回首页</a>
            <a href="/auth/google" class="btn btn-secondary">重新登录</a>
        </div>
        ${isDev ? `
        <div class="debug show">
            <h3>调试信息（仅开发环境）</h3>
            <pre>${escapeHtml(JSON.stringify(details, null, 2))}</pre>
        </div>
        ` : ''}
    </div>
</body>
</html>`;
    
    return new Response(html, {
        status,
        headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            // CORS 支持
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Credentials': 'true'
        }
    });
}

/**
 * 根据状态码获取标题
 */
function getErrorTitle(status) {
    switch (status) {
        case 400: return '请求错误';
        case 401: return '未授权';
        case 403: return '访问禁止';
        case 404: return '页面未找到';
        case 500: return '服务器错误';
        case 502: return '网关错误';
        default: return '出错了';
    }
}

/**
 * 根据状态码获取主题色
 */
function getStatusColor(status) {
    if (status >= 500) return '#ef4444'; // red
    if (status >= 400) return '#f59e0b'; // amber
    if (status >= 300) return '#3b82f6'; // blue
    return '#10b981'; // green
}

/**
 * 根据状态码获取图标（emoji）
 */
function getStatusIcon(status) {
    if (status >= 500) return '💥';
    if (status >= 400) return '⚠️';
    if (status >= 300) return '↩️';
    return '✅';
}

/**
 * HTML 转义，防止 XSS
 */
function escapeHtml(text) {
    if (typeof text !== 'string') return String(text);
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}
