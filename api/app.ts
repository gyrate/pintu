import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import taskRoutes from './routes/tasks.js';
import imageRoutes from './routes/images.js';
import userRoutes from './routes/users.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' })); // 增加限制以上传大图
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 路由
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/users', userRoutes);

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 错误处理
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Something went wrong!' });
});

export default app;
