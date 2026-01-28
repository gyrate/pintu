# Vercel Serverless Function 优化计划

**核心问题**：Vercel 将 `api/` 目录下的所有 13 个文件都识别为独立的 Serverless Functions，超过了 Hobby 计划的 12 个限制。

**解决方案**：将后端业务逻辑移出 `api/` 目录，只保留唯一的入口文件 `api/index.ts`。

## 执行步骤

1. **创建目录**: 在根目录下新建 `server/` 文件夹。
2. **迁移文件**:

   * 将以下文件/文件夹从 `api/` 移动到 `server/`:

     * `config/`

     * `middleware/`

     * `routes/`

     * `utils/`

     * `app.ts`

     * `server.ts`

   * **保留** `api/index.ts` 在原位。
3. **修改入口文件**:

   * 修改 `api/index.ts`: 将 `import app from './app.js'` 改为 `import app from '../server/app.js'`。
4. **更新项目配置**:

   * 修改 `tsconfig.json`: 将 `server` 目录加入 `include`，确保 TS 能编译新位置的代码。

   * 修改 `nodemon.json`: 将监听目录改为 `server`，启动命令改为 `tsx server/server.ts`，确保本地开发正常运行。

这样调整后，Vercel 只会看到 `api/index.ts` 这一个 Function，完美规避数量限制，同时保持所有功能不变。
