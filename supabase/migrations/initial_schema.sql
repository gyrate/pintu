-- 用户表 (users)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone VARCHAR(20) UNIQUE NOT NULL,
    nickname VARCHAR(50) NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);

-- 任务表 (tasks)
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    direction VARCHAR(10) CHECK (direction IN ('down', 'right')),
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'completed')),
    export_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at DESC);

-- 图片表 (images)
CREATE TABLE IF NOT EXISTS images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_name VARCHAR(255) NOT NULL,
    storage_path TEXT NOT NULL,
    width INTEGER NOT NULL,
    height INTEGER NOT NULL,
    file_size INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_images_created_at ON images(created_at DESC);

-- 任务图片关联表 (task_images)
CREATE TABLE IF NOT EXISTS task_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    image_id UUID NOT NULL REFERENCES images(id) ON DELETE CASCADE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(task_id, image_id)
);

CREATE INDEX IF NOT EXISTS idx_task_images_task_id ON task_images(task_id);
CREATE INDEX IF NOT EXISTS idx_task_images_sort_order ON task_images(task_id, sort_order);

-- 基本权限设置
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE images ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_images ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON users TO anon;
GRANT ALL PRIVILEGES ON users TO authenticated;
GRANT ALL PRIVILEGES ON users TO service_role;

GRANT SELECT ON tasks TO anon;
GRANT ALL PRIVILEGES ON tasks TO authenticated;
GRANT ALL PRIVILEGES ON tasks TO service_role;

GRANT SELECT ON images TO anon;
GRANT ALL PRIVILEGES ON images TO authenticated;
GRANT ALL PRIVILEGES ON images TO service_role;

GRANT SELECT ON task_images TO anon;
GRANT ALL PRIVILEGES ON task_images TO authenticated;
GRANT ALL PRIVILEGES ON task_images TO service_role;

-- 允许 Service Role 无视 RLS
-- (Supabase Service Role Key 默认绕过 RLS，但为了保险起见，我们可以添加 permissive policies，或者依赖默认行为)
-- 这里添加一些基础策略以便前端也能在必要时访问

CREATE POLICY "Allow public read users" ON users FOR SELECT USING (true);
CREATE POLICY "Allow authenticated full access users" ON users FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow public read tasks" ON tasks FOR SELECT USING (true);
CREATE POLICY "Allow authenticated full access tasks" ON tasks FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow public read images" ON images FOR SELECT USING (true);
CREATE POLICY "Allow authenticated full access images" ON images FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow public read task_images" ON task_images FOR SELECT USING (true);
CREATE POLICY "Allow authenticated full access task_images" ON task_images FOR ALL TO authenticated USING (true);
