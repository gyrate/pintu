# 第三方拼图 API 开放平台设计方案

本方案旨在将现有的图片上传与拼接功能开放给第三方开发者调用。

## 1. 认证机制设计 (Authentication)

* **API Key (永久 Token)**

  * **设计**: 采用 `API Key` (如 `Bearer sk-xxxxxxxx`) 机制，而非短期 JWT。

  * **理由**: 第三方调用通常是服务器对服务器 (Server-to-Server) 的后台任务，需要长期有效且稳定的凭证，避免频繁刷新 Token。

  * **实现**:

    * 在 `users` 表中新增 `api_key` 字段 (UUID 或生成的随机字符串)。

    * 创建一个新的中间件 `authenticateApiKey`，用于验证请求头中的 `Authorization: Bearer <api_key>` 或 `X-API-Key: <api_key>`。

    * **无需登录**: 演示页面将使用一个预设的公共测试 Key，或者提供一个"申请 Key"的入口（简化版可直接在页面展示一个测试 Key）。

## 2. API 接口设计

为了对第三方友好，我们需要封装一套 RESTful 风格的 Open API。

### 2.1 上传图片接口

* **Endpoint**: `POST /api/open/upload`

* **Content-Type**: `multipart/form-data`

* **Params**: `file` (文件流)

* **Response**:

  ```json
  {
    "id": "img_uuid",
    "url": "https://...",
    "width": 1024,
    "height": 768
  }
  ```

### 2.2 拼接长图接口

* **Endpoint**: `POST /api/open/stitch`

* **Content-Type**: `application/json`

* **Body**:

  ```json
  {
    "image_ids": ["img_uuid_1", "img_uuid_2"], // 方式一：使用上传后返回的 ID (推荐，复用现有逻辑)
    "image_urls": ["https://...", "https://..."], // 方式二：直接传 URL (可选，需后端支持下载外部图片)
    "direction": "down" // "down" | "right", default "down"
  }
  ```

* **Response**:

  ```json
  {
    "result_url": "https://...",
    "width": 1080,
    "height": 5000
  }
  ```

  *注：初期仅支持* *`image_ids`* *方式，复用现有 Storage 逻辑，性能更好。*

## 3. 文档与演示页面

### 3.1 API 文档 (`API_DOC.md`)

* 创建 `API_DOC.md` 文件，包含：

  * 鉴权方式说明

  * 接口地址、参数、返回示例

  * 错误码说明

### 3.2 调用示例页面 (`public/demo.html`)

* 创建一个纯 HTML/JS 的静态页面。

* **功能**:

  * 简单的文件选择器。

  * "上传" 按钮 (调用 `/api/open/upload`)。

  * 图片列表展示。

  * "生成长图" 按钮 (调用 `/api/open/stitch`)。

  * 结果展示区。

* **无需登录**: 页面内嵌一个仅用于演示的 `DEMO_API_KEY` (关联到一个特定的演示用户)。

## 4. 实施步骤

1. **数据库变更**: 给 `users` 表添加 `api_key` 字段。
2. **后端开发**:

   * 创建 `api/middleware/openAuth.ts`。

   * 创建 `api/routes/open.ts`，封装 upload 和 stitch 逻辑。

   * 在 `api/app.ts` 中注册 `/api/open` 路由。
3. **文档编写**: 撰写 `API_DOC.md`。
4. **演示页面**: 开发 `public/demo.html`。

## 5. 风险控制 (简易版)

* 限制演示 Key 的上传频率或文件大小（可选，暂不深入）。

* 演示 Key 关联的用户数据定期清理。

