# Supabase JWT 认证迁移计划

如果你打算将应用正式部署并使用 Supabase 作为后端服务，当前的 Mock Token 机制将无法满足安全性和功能需求（特别是 Row Level Security - RLS）。

你需要将认证逻辑迁移到使用 Supabase 官方的 JWT 签名机制。

## 1. 核心概念

* **JWT Secret**: Supabase 项目设置中提供的一个密钥 (`JWT Secret`)，用于签名和验证 Token。
* **Payload**: Token 中需要包含 Supabase 识别的标准字段：
  * `aud`: audience，通常为 `"authenticated"`。
  * `sub`: subject，即用户的 UUID (`user.id`)。
  * `role`: 数据库角色，通常为 `"authenticated"`。
  * `exp`: 过期时间。
  * `app_metadata` & `user_metadata`: 可选，用于存储自定义用户信息。

## 2. 迁移步骤

### 2.1 安装依赖
需要安装 `jsonwebtoken` 库来生成符合 Supabase 标准的 JWT。

* `npm install jsonwebtoken`
* `npm install -D @types/jsonwebtoken`

### 2.2 环境变量配置 (`.env`)
在 `.env` 文件中添加 Supabase 项目的 JWT Secret（可在 Supabase Dashboard -> Project Settings -> API 中找到）。

```env
SUPABASE_JWT_SECRET=your-supabase-jwt-secret
```

### 2.3 后端代码调整 (`api/routes/auth.ts`)

修改 `/login` 接口，不再返回 Mock Token，而是使用 `jsonwebtoken` 签发真实的 Token。

```typescript
import jwt from 'jsonwebtoken';

// ...

// 登录成功后签发 Token
const token = jwt.sign(
  {
    aud: 'authenticated', // 必须
    role: 'authenticated', // 必须，匹配 RLS 策略
    sub: user.id,          // 必须，用户 ID
    // 可选：将自定义角色放入 app_metadata，方便在 RLS 中使用
    app_metadata: {
      roles: user.roles || ['user'], 
      provider: 'email'
    }
  },
  process.env.SUPABASE_JWT_SECRET!, // 使用环境变量中的 JWT Secret
  { expiresIn: '7d' } // Token 有效期
);

res.json({
  token,
  user
});
```

### 2.4 (可选) RLS 策略调整
如果你的数据库表开启了 RLS，并依赖 `auth.uid()` 或 `auth.jwt()`，那么上述 Token 就能让这些策略正常工作了。

例如，你可以编写如下策略来利用 `app_metadata` 中的角色：
```sql
create policy "Allow admins" on some_table
  to authenticated
  using (
    (auth.jwt() -> 'app_metadata' -> 'roles')::jsonb ? 'admin'
  );
```

## 3. 为什么不使用 Supabase Auth (GoTrue)?
目前的架构是**自建用户表 (`users`) + 自建认证接口 (`/api/auth/login`)**。
* **优点**: 拥有完全的数据控制权，可以随意设计用户表结构（如 `roles` 数组），不依赖 Supabase Auth 服务的特定逻辑。
* **缺点**: 需要自己维护 Token 签发、密码哈希、重置密码等逻辑。
* **结论**: 既然已经实现了自建用户表，通过**自签 JWT** 的方式对接 Supabase RLS 是最平滑的迁移方案，既保留了现有的业务逻辑，又能利用 Supabase 的安全能力。

## 4. 下一步行动
如果你确认要执行此迁移，我将：
1. 安装 `jsonwebtoken`。
2. 修改 `api/routes/auth.ts` 实现真实 JWT 签发。
3. 提示你设置环境变量。
