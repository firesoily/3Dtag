/**
 * 3Dtag Auth Worker - 主入口
 * 处理 Google OAuth 和用户数据 API
 */

import { handleGoogleAuth, handleGoogleCallback } from './routes/auth.js';
import { handleApi } from './routes/api.js';

/**
 * Worker 主入口
 */
export default {
    async fetch(request, env, ctx) {
        try {
            // TEST: 强制抛出异常以验证错误处理
            // throw new Error('TEST ERROR: 如果看到这个，说明 try-catch 工作正常');
            const url = new URL(request.url);
            console.log(`${request.method} ${url.pathname}`);

            // 认证路由
            if (url.pathname === '/auth/google') {
                return await handleGoogleAuth(request, env, ctx);
            }

            if (url.pathname === '/auth/google/callback') {
                return await handleGoogleCallback(request, env, ctx);
            }

            // API 路由
            if (url.pathname.startsWith('/api/')) {
                return await handleApi(request, env, ctx);
            }

            // 健康检查
            if (url.pathname === '/health' || url.pathname === '/') {
                return new Response('3Dtag Auth Worker is running', {
                    status: 200,
                    headers: { 'Content-Type': 'text/plain' }
                });
            }

            return new Response('Not Found', { status: 404 });

        } catch (err) {
            console.error('Worker top-level error:', err);
            return new Response(`Internal Server Error: ${err.message}`, { status: 500 });
        }
    }
};
