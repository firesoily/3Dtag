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
        const url = new URL(request.url);

        console.log(`${request.method} ${url.pathname}`);

        try {
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
            console.error('Worker error:', err);
            return new Response(`Internal Server Error: ${err.message}`, { status: 500 });
        }
    }
};
