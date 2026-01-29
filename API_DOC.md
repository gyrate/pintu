# 拼图开放平台 API 文档

本文档描述了如何通过 API 调用拼图服务的核心功能：上传图片和生成长图。

*   **Base URL**: `https://gyrate.top/api/open`

## 1. 鉴权 (Authentication)

所有接口均需要通过 `API Key` 进行鉴权。

*   **方式一 (推荐)**: 在 HTTP Header 中添加 `Authorization` 字段。
    ```
    Authorization: Bearer <your_api_key>
    ```
*   **方式二**: 在 HTTP Header 中添加 `X-API-Key` 字段。
    ```
    X-API-Key: <your_api_key>
    ```

**测试用 Key**: `sk-r0z3io4kastv7w271uud`

---

## 2. 接口列表

### 2.1 上传图片

将本地图片上传至服务器，获取图片的唯一 ID 和 URL。

*   **URL**: `/upload`
*   **Method**: `POST`
*   **Content-Type**: `multipart/form-data`

#### 请求参数

| 参数名 | 类型 | 必填 | 描述 |
| :--- | :--- | :--- | :--- |
| `file` | File | 是 | 图片文件 (支持 jpg, png, webp 等) |

#### 响应示例

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "url": "https://your-supabase-url.com/storage/v1/object/public/pintu-images/uploads/1700000000-123.jpg",
  "width": 1024,
  "height": 768
}
```

---

### 2.2 拼接长图

将多张已上传的图片拼接成一张长图。

*   **URL**: `/stitch`
*   **Method**: `POST`
*   **Content-Type**: `application/json`

#### 请求参数

| 参数名 | 类型 | 必填 | 描述 |
| :--- | :--- | :--- | :--- |
| `image_ids` | string[] | 选填 | 图片 ID 数组 (来源于上传接口的返回)，按数组顺序拼接。**与 `image_urls` 二选一** |
| `image_urls` | string[] | 选填 | 图片 URL 数组，支持直接拼接网络图片。**与 `image_ids` 二选一** |
| `direction` | string | 否 | 拼接方向，可选值: `"down"` (默认, 向下拼), `"right"` (向右拼) |

#### 响应示例

```json
{
  "result_url": "https://your-supabase-url.com/storage/v1/object/public/pintu-images/exports/open_api_1700000000.png",
  "width": 1024,
  "height": 2304
}
```

---

## 3. 错误码

接口可能返回以下 HTTP 状态码：

*   `200`: 成功
*   `400`: 请求参数错误 (如文件未上传、缺少参数)
*   `401`: 未提供 API Key
*   `403`: API Key 无效
*   `500`: 服务器内部错误
