# Pintu 拼图应用

一个基于 Web 的轻量级「长图拼接 / 日常拼图」工具，包含：

- H5 前端：给普通用户在手机上使用的拼图界面
- 管理后台：用于查看用户、任务和图片数据
- 后端服务：负责登录、任务管理和图片拼接导出
- Supabase：承担数据库和对象存储（图片文件）

整体目标是：**让用户把多张图片一键拼成一张长图，方便分享到社交平台或做内容归档**。

---

## 解决了什么问题

传统做长图 / 拼图时常见的问题：

- 需要下载 App，门槛高、体验不统一
- 手机截图、图片尺寸不统一，拼接时容易出现白边、错位
- 生成后的图片难以管理与再次编辑

Pintu 通过 Web 方案解决这些痛点：

- 直接浏览器打开即可使用，不需要安装
- 自动按照方向（纵向 / 横向）拼接，并做基础等比缩放，保证**无缝对齐**
- 将任务和图片记录在 Supabase 中，支持后续再次进入任务继续编辑、导出

---

## 功能概览

### H5 用户端

- 手机号 + 验证码模拟登录（首登自动注册）
- 任务列表：查看自己创建的拼图任务
- 新建 / 编辑任务：
  - 上传多张图片
  - 调整拼接顺序
  - 切换拼接方向（向下 / 向右）
  - 保存任务草稿
- 一键导出：
  - 后端使用 `sharp` 将图片在服务端拼接
  - 生成 PNG 长图并存储到 Supabase Storage
  - 返回可访问的公开地址，前端直接预览 / 保存

### 管理后台

- 登录：与 H5 共用账号体系
- 用户管理：查看注册用户列表
- 任务管理：
  - 查看所有任务及状态（草稿 / 已完成）
  - 支持删除任务
- 图片管理（间接）：通过任务详情查看相关图片数据

### 后端 API

- `/api/auth/login`：手机号登录 / 注册
- `/api/tasks`：
  - `GET /api/tasks?userId=`：查询用户任务
  - `GET /api/tasks/:id`：任务详情 + 图片列表
  - `POST /api/tasks`：创建任务
  - `PUT /api/tasks/:id`：更新任务及图片顺序
  - `DELETE /api/tasks/:id`：删除任务
  - `POST /api/tasks/:id/export`：执行拼接并生成导出图片
- `/api/images`：
  - `POST /api/images/upload`：上传单张图片并绑定任务
  - `DELETE /api/images/:id`：删除图片（数据库 + 存储）
- `/api/users`：
  - `GET /api/users`：后台用户列表

---

## 技术栈

### 前端

- 框架：Vue 3 + TypeScript
- 构建工具：Vite
- 路由：Vue Router
- 状态管理：Pinia
- UI 组件：
  - H5 端：Vant 4
  - 管理端：Element Plus

### 后端

- Node.js + Express
- TypeScript（`api/*.ts` 使用 ESM 模式）
- 图片处理：Sharp
- 上传处理：Multer（内存存储）
- 配置管理：dotenv

### 数据与存储

- Supabase Postgres
  - `users`：用户表（手机号、昵称、头像等）
  - `tasks`：任务表（名称、方向、状态、导出地址等）
  - `images`：图片表（文件路径、尺寸、大小等）
  - `task_images`：任务与图片的关联表（顺序）
- Supabase Storage
  - Bucket：`pintu-images`
  - 存储原始图片与导出的长图

---

## 项目结构（简要）

```text
api/                # 后端服务（Express + TypeScript）
  config/supabase.ts
  routes/
    auth.ts
    tasks.ts
    images.ts
    users.ts
  utils/
    stitch.ts       # 使用 sharp 进行图片拼接

src/
  h5/               # H5 用户端
    pages/
      HomePage.vue
      EditPage.vue
      LoginPage.vue
      ProfilePage.vue
  admin/            # 管理后台
    pages/
      HomePage.vue
      Dashboard.vue
      Login.vue
      TaskList.vue
      UserList.vue

supabase/
  migrations/
    initial_schema.sql       # 表结构 + 基础 RLS 策略
    permissive_policies.sql  # 较宽松的访问策略（开发环境）
    create_storage_bucket.sql# 创建 pintu-images 存储桶
```

---

## 本地开发与运行

### 环境要求

- Node.js 18+（推荐）
- 已创建 Supabase 项目，并在 `.env` 中配置：
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`

### 安装依赖

```bash
npm install
```

### 启动开发环境

```bash
npm run dev
```

- Vite H5 / Admin 前端：<http://localhost:5173>
- 本地 API 服务：<http://localhost:3001>
- 开发时前端通过 Vite 代理访问 `/api/**` 接口

### 构建前端

```bash
npm run build
```

构建结果输出到 `dist/`，包含：

- `index.html`：H5 入口
- `admin.html`：管理后台入口

---

## 部署说明（Vercel + Supabase）

- 前端：
  - 使用 Vercel 部署 `dist/` 目录
  - 通过 `vercel.json` 的 `rewrites` 将 `/api/*` 转发到 Serverless Function `/api/index`
- 后端：
  - `api/index.ts` 作为 Vercel Serverless 入口，导出 Express 应用
  - 所有 `/api/**` 的请求交由 `api/app.ts` 中的路由处理
- 配置：
  - 在 Vercel 项目的 Environment Variables 中配置和本地 `.env` 相同的 Supabase 相关变量

---

## 待解决 / 待优化

- **鉴权与安全**
  - 当前登录为简化的「手机号 + 任意验证码」方案，仅适用于开发 / Demo
  - 后续可接入真正的短信服务 + JWT 鉴权
- **权限模型**
  - 目前 Supabase RLS 策略偏宽松，适合开发阶段
  - 生产环境需要收紧 RLS，并严格区分服务端 Service Role 与前端 Anon Key 的权限
- **图片处理与性能**
  - 大量或超大尺寸图片拼接时，Sharp 内存占用较高
  - 可以加入图片数量/尺寸限制，以及后台异步任务队列
- **异常与监控**
  - 目前主要通过日志输出错误信息
  - 可接入如 Sentry 等监控平台，提升线上问题发现能力
- **产品功能**
  - 更多布局方式（九宫格、多行多列等）
  - 文字说明、贴纸、背景主题等增强编辑能力

---

## 适用场景

- 内容创作者整理一组截图 / 配图，快速生成一张长图
- 记录聊天记录、订单记录、学习笔记等，将多张截屏拼接成一张
- 轻量级的 Web 拼图工具 Demo / 教学项目

如果你想在此基础上继续扩展功能（如真正的账号体系、团队协作、模板市场等），当前架构也可以比较平滑地演进。
