# Dashboard 修复与升级计划

本计划旨在修复 Dashboard 页面统计数据为 0 的问题，并新增多维度的统计功能（包含趋势图）。

## 1. 依赖管理
- 安装 `echarts` 库，用于前端展示趋势图表。
  - `npm install echarts`

## 2. 数据库变更
创建迁移文件 `supabase/migrations/create_login_logs.sql`：
- 创建 `login_logs` 表，记录用户登录行为（`user_id`, `login_at`）。
- 确保 `user_id` 是外键，且级联删除。

## 3. 后端 API 开发 (`api/`)
### 3.1 登录日志记录 (`api/routes/auth.ts`)
- 修改登录接口，在验证通过后，向 `login_logs` 表插入一条记录。

### 3.2 仪表盘聚合接口 (`api/routes/dashboard.ts`)
- 新建 `GET /stats` 接口，一次性返回以下数据：
    - **基础计数**：
        - 用户总数 (Total Users)
        - 任务总数 (Total Tasks)
        - 媒体总数 (Total Media/Images)
        - 生成结果数 (Total Results / Completed Tasks with export_url)
    - **趋势统计** (Trends)：
        - **任务生成次数**：最近7天、最近30天、最近12个月的统计（按时间分组 count）。
        - **用户登录次数**：最近7天、最近30天、最近12个月的统计（基于 `login_logs`）。
- 为了简化实现，后端可以返回按天/月聚合的原始数据数组，由前端进行最终的图表数据格式化。

### 3.3 注册路由 (`api/server.ts`)
- 注册新的 `/api/dashboard` 路由。

## 4. 前端开发 (`src/admin/`)
### 4.1 API 客户端更新 (`src/admin/api/client.ts`)
- 增加 `getDashboardStats()` 方法调用新的后端接口。

### 4.2 Dashboard 页面重构 (`src/admin/pages/Dashboard.vue`)
- **修复**：移除旧的 `users.length` 逻辑，改用后端返回的精准计数。
- **UI 升级**：
    - **顶部卡片**：展示 4 个核心指标（用户、任务、媒体、结果）。
    - **中间图表区**：使用 ECharts 展示两个折线图/柱状图：
        - 左侧：生成任务趋势（支持切换 周/月/年 视图）。
        - 右侧：用户登录趋势（支持切换 周/月/年 视图）。
    - **样式优化**：使用 Element Plus 的 Card 和 Layout 组件美化布局。

## 验证计划
1.  **数据修复验证**：刷新 Dashboard，确认顶部卡片显示正确的总数（不再是 0）。
2.  **登录日志验证**：执行一次登录操作，检查数据库 `login_logs` 表是否新增记录。
3.  **图表验证**：
    - 检查图表是否渲染。
    - 检查图表数据是否随时间范围切换而变化（由于是新表，登录数据可能只有当天的，历史任务数据应该能显示）。
