# 3Dtag Auth Worker

Google OAuth 2.0 认证服务，为 3Dtag 提供用户登录和数据持久化功能。

## 🚀 功能

- ✅ Google OAuth 登录/登出
- ✅ 用户信息管理（email, name, avatar）
- ✅ 会话管理（HTTP-only cookie）
- ✅ 用户数据存储（localStorage 迁移到云端）
- ✅ 免费：Cloudflare Workers + D1 免费额度

## 📦 架构

- **Worker**: 处理 OAuth 流程、会话验证、用户数据 API
- **D1 Database**: 存储用户信息和个性化数据
- **Cookie**: HTTP-only session cookie（防 XSS）
- **前端**: 通过 `/api/*` 接口与 Worker 通信

## 🔧 部署步骤

### 1. 安装依赖

```bash
cd worker
npm install
```

### 2. 配置 Cloudflare

登录 Cloudflare Dashboard，确保已创建 D1 数据库：
- 名称: `3dtag-auth-db`
- 记录 `database_id`（修改 `wrangler.toml`）

### 3. 设置环境变量（Secrets）

**重要：不要将敏感信息写入代码！**

```bash
# 设置 Google OAuth 凭据（使用你从 Google Cloud Console 获取的值）
npx wrangler secret put CLIENT_ID
# 输入: YOUR_GOOGLE_CLIENT_ID

npx wrangler secret put CLIENT_SECRET
# 输入: YOUR_GOOGLE_CLIENT_SECRET
```

### 4. 推送数据库 Schema

```bash
# 本地测试模式（无 remote 参数）
npx wrangler d1 execute 3dtag-auth-db --file=src/db/schema.sql

# 生产环境（remote）
npx wrangler d1 execute 3dtag-auth-db --file=src/db/schema.sql --remote
```

### 5. 部署 Worker

```bash
# 开发环境
npx wrangler dev

# 生产部署
npx wrangler deploy
```

首次部署会提示创建 `application.3dtag-auth`，确认即可。

### 6. 绑定自定义域名（可选）

在 Cloudflare Dashboard:
1. Workers & Pages → 3dtag-auth → Triggers
2. 添加 Custom domain: `auth.3dtag.shop` (推荐子域名)
3. 按照 DNS 验证流程完成绑定

**注意**：
- Pages 已使用 `3dtag.shop`，Worker 必须用不同子域名（如 `auth.3dtag.shop`）
- 如果坚持用同一域名，需合并 Pages 和 Worker，但 OAuth callback 需要不同路径。推荐方案：Pages 用 `3dtag.shop`，Worker 用 `auth.3dtag.shop`

### 7. 配置 Google OAuth 回调地址

在 Google Cloud Console → Credentials:
- 添加 Authorized redirect URI:
  - https://auth.3dtag.shop/auth/google/callback (自定义域名)
  - 或 https://3dtag-auth.workers.dev/auth/google/callback (默认 workers.dev)

## 🔗 前端集成

Worker 部署完成后，修改前端代码：

1. 在 `index.html` 添加登录按钮
2. 创建 `src/auth/auth-client.js` 封装 API
3. 创建 `src/auth/auth-ui.js` 处理 UI 逻辑
4. 迁移 localStorage 数据到云端

详细前端集成步骤见 `FRONTEND_INTEGRATION.md`。

## 📚 API 参考

### POST /auth/google
启动 OAuth 流程。浏览器应重定向到此 URL。

**返回**: 302 Redirect 到 Google OAuth 页面

### GET /auth/google/callback
OAuth 回调端点（用户不会直接访问）。

**Query params**:
- `code` - 授权码（Google 传递）
- `state` - 防 CSRF 令牌

**返回**: 302 Redirect 到前端首页，并设置 session cookie

### GET /api/user
获取当前登录用户信息。

**返回**:
```json
{
  "authenticated": true,
  "user": {
    "id": "1234567890",
    "email": "user@example.com",
    "name": "John Doe",
    "picture": "https://..."
  }
}
```

### POST /api/logout
登出当前用户。

**返回**:
```json
{ "success": true }
```

### GET /api/user-data?key=xxx
获取用户数据。

### GET /api/user-data
获取所有用户数据。

### POST /api/user-data
保存用户数据。Body: `{ "key": "settings", "value": {...} }`

### DELETE /api/user-data?key=xxx
删除用户数据。

## 🗄️ 数据表结构

**users**:
- `id` (TEXT, PRIMARY KEY) - Google sub
- `email` (TEXT, UNIQUE)
- `name` (TEXT)
- `picture` (TEXT)
- `created_at` (DATETIME)

**user_data**:
- `user_id` (TEXT)
- `key` (TEXT)
- `value` (TEXT, JSON)
- PRIMARY KEY: (user_id, key)

**sessions**:
- `session_id` (TEXT, PRIMARY KEY)
- `user_id` (TEXT)
- `expires_at` (DATETIME)

## 🔒 安全考虑

- ✅ Session cookie: `HttpOnly` + `SameSite=Lax`
- ✅ State 参数防 CSRF
- ✅ D1 预编译语句防 SQL 注入
- ✅ 会话过期自动清理（建议添加定时任务）
- ⚠️ 生产环境应启用 `Access-Control-Allow-Origin` 限制域名

## 📝 开发日志

- 2026-03-23: 初始版本，完整 OAuth 流程 + D1 存储

## 📄 许可证

MIT
