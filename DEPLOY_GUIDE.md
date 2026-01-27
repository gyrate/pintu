# 拼图应用生产环境部署指南

由于 Supabase 主要提供数据库和认证服务，不直接支持托管 Node.js (Express) 后端应用，我们推荐使用 **Vercel + Supabase** 的黄金组合。

本项目已经配置好了 Vercel 的部署文件 (`vercel.json`)，可以直接一键部署。

## 第一步：准备 Supabase 数据库

1. 访问 [Supabase 官网](https://supabase.com/) 并注册/登录。
2. 点击 **"New Project"** 创建一个新项目。
   - Name: `pintu-prod` (或其他你喜欢的名字)
   - Database Password: **务必记下来**，稍后可能用到。
   - Region: 选择离用户最近的区域（如 Singapore, Tokyo 等）。
3. 等待项目创建完成（几分钟）。
4. 进入项目面板，找到 **SQL Editor** (左侧图标)。
5. 点击 **"New Query"**。
6. 打开本地文件 `e:\拼图app\pintu\supabase\full_production_schema.sql`，复制全部内容。
7. 将内容粘贴到 Supabase 的 SQL 编辑器中，点击右下角的 **"Run"** 按钮。
   - 确保看到 "Success" 提示。这将一次性创建所有表、索引和存储桶。

## 第二步：获取 Supabase 环境变量

在 Supabase 项目面板中：
1. 点击左下角的 **Project Settings** (齿轮图标)。
2. 选择 **API** 菜单。
3. 记录下以下信息（复制备用）：
   - **Project URL** (这是 `VITE_SUPABASE_URL`)
   - **anon public** (这是 `VITE_SUPABASE_ANON_KEY`)
   - **service_role** (这是 `SUPABASE_SERVICE_ROLE_KEY`) - *注意保密*
   - **JWT Secret** (在下面的 JWT Settings 部分) (这是 `SUPABASE_JWT_SECRET`)

## 第三步：部署到 Vercel

1. 访问 [Vercel 官网](https://vercel.com/) 并注册/登录（推荐用 GitHub 账号）。
2. 将你的代码提交到 GitHub/GitLab (如果还没有的话)。
3. 在 Vercel Dashboard 点击 **"Add New..."** -> **"Project"**。
4. 导入你的 `pintu` 代码仓库。
5. 在 **Configure Project** 页面：
   - **Framework Preset**: 应该会自动识别为 `Vite`。
   - **Root Directory**: 保持默认 (`./`)。
   - **Environment Variables** (环境变量)：
     展开此项，逐个添加之前从 Supabase 获取的值：

     | Key | Value |
     | --- | --- |
     | `VITE_SUPABASE_URL` | 填入 Project URL |
     | `VITE_SUPABASE_ANON_KEY` | 填入 anon public key |
     | `SUPABASE_SERVICE_ROLE_KEY` | 填入 service_role key |
     | `SUPABASE_JWT_SECRET` | 填入 JWT Secret |

6. 点击 **"Deploy"** 按钮。

## 第四步：验证部署

1. 等待部署完成，Vercel 会给你一个访问域名（例如 `pintu-xyz.vercel.app`）。
2. 点击访问该域名。
3. 测试功能：
   - 尝试注册/登录。
   - 创建任务。
   - 上传图片（确保图片能正常显示，说明 Storage 配置正确）。
   - 查看管理后台（访问 `/admin.html` 或对应路由）。

## 常见问题

- **图片上传失败**：请检查 Supabase Storage 中的 `pintu-images` bucket 是否创建成功，以及策略（Policies）是否允许 public 读写。我们的 SQL 脚本应该已经处理了这点。
- **登录后 401**：检查 `SUPABASE_JWT_SECRET` 是否正确配置。
- **页面 404**：Vercel 应该会自动处理前端路由（rewrites），如果刷新页面 404，请检查 `vercel.json` 是否生效。

祝贺你！你的拼图应用已经上线了！🚀
