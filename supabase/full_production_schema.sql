-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone VARCHAR(20) UNIQUE NOT NULL,
    nickname VARCHAR(50) NOT NULL,
    avatar_url TEXT,
    password_hash VARCHAR(255),
    roles TEXT[] DEFAULT ARRAY['user'],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_roles ON users USING GIN (roles);

-- 2. Tasks Table
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

-- 3. Images Table
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

-- 4. Task Images Association Table
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

-- 5. Login Logs Table
CREATE TABLE IF NOT EXISTS login_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    login_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_login_logs_login_at ON login_logs(login_at);
CREATE INDEX IF NOT EXISTS idx_login_logs_user_id ON login_logs(user_id);

-- 6. Storage Bucket Setup
INSERT INTO storage.buckets (id, name, public)
VALUES ('pintu-images', 'pintu-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
DROP POLICY IF EXISTS "Give users access to own folder 1oj01k_0" ON storage.objects;
DROP POLICY IF EXISTS "Give users access to own folder 1oj01k_1" ON storage.objects;
DROP POLICY IF EXISTS "Give users access to own folder 1oj01k_2" ON storage.objects;
DROP POLICY IF EXISTS "Give users access to own folder 1oj01k_3" ON storage.objects;

CREATE POLICY "Public Access Select" ON storage.objects FOR SELECT TO public USING (bucket_id = 'pintu-images');
CREATE POLICY "Public Access Insert" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'pintu-images');
CREATE POLICY "Public Access Update" ON storage.objects FOR UPDATE TO public USING (bucket_id = 'pintu-images');
CREATE POLICY "Public Access Delete" ON storage.objects FOR DELETE TO public USING (bucket_id = 'pintu-images');

-- 7. Row Level Security (RLS) - Permissive Mode for Production Stability
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE images ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_images ENABLE ROW LEVEL SECURITY;

-- Clear existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow anon full access users" ON users;
DROP POLICY IF EXISTS "Allow authenticated full access users" ON users;
DROP POLICY IF EXISTS "Allow anon full access tasks" ON tasks;
DROP POLICY IF EXISTS "Allow authenticated full access tasks" ON tasks;
DROP POLICY IF EXISTS "Allow anon full access images" ON images;
DROP POLICY IF EXISTS "Allow authenticated full access images" ON images;
DROP POLICY IF EXISTS "Allow anon full access task_images" ON task_images;
DROP POLICY IF EXISTS "Allow authenticated full access task_images" ON task_images;

-- Create permissive policies
CREATE POLICY "Allow anon full access users" ON users FOR ALL TO anon USING (true);
CREATE POLICY "Allow authenticated full access users" ON users FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow anon full access tasks" ON tasks FOR ALL TO anon USING (true);
CREATE POLICY "Allow authenticated full access tasks" ON tasks FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow anon full access images" ON images FOR ALL TO anon USING (true);
CREATE POLICY "Allow authenticated full access images" ON images FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow anon full access task_images" ON task_images FOR ALL TO anon USING (true);
CREATE POLICY "Allow authenticated full access task_images" ON task_images FOR ALL TO authenticated USING (true);

-- 8. Seed Super Admin (Optional)
-- UPDATE users SET roles = ARRAY['superAdmin', 'admin', 'user'] WHERE phone = 'YOUR_ADMIN_PHONE';
