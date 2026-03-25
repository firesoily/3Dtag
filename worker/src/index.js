import { handleGoogleAuth, handleGoogleCallback } from './routes/auth.js';
import { handleApi } from './routes/api.js';

export default {
    async fetch(request, env, ctx) {
        try {
            const url = new URL(request.url);
            console.log(`${request.method} ${url.pathname}`);

            if (url.pathname === '/auth/google') {
                return await handleGoogleAuth(request, env, ctx);
            }

            if (url.pathname === '/auth/google/callback') {
                return await handleGoogleCallback(request, env, ctx);
            }

            if (url.pathname.startsWith('/api/')) {
                return await handleApi(request, env, ctx);
            }

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
