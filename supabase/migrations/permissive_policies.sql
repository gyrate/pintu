-- 放宽 RLS 策略，允许 anon 角色完全访问（临时方案，解决 Service Role Key 问题）

DROP POLICY IF EXISTS "Allow public read users" ON users;
DROP POLICY IF EXISTS "Allow authenticated full access users" ON users;
CREATE POLICY "Allow anon full access users" ON users FOR ALL TO anon USING (true);
CREATE POLICY "Allow authenticated full access users" ON users FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow public read tasks" ON tasks;
DROP POLICY IF EXISTS "Allow authenticated full access tasks" ON tasks;
CREATE POLICY "Allow anon full access tasks" ON tasks FOR ALL TO anon USING (true);
CREATE POLICY "Allow authenticated full access tasks" ON tasks FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow public read images" ON images;
DROP POLICY IF EXISTS "Allow authenticated full access images" ON images;
CREATE POLICY "Allow anon full access images" ON images FOR ALL TO anon USING (true);
CREATE POLICY "Allow authenticated full access images" ON images FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow public read task_images" ON task_images;
DROP POLICY IF EXISTS "Allow authenticated full access task_images" ON task_images;
CREATE POLICY "Allow anon full access task_images" ON task_images FOR ALL TO anon USING (true);
CREATE POLICY "Allow authenticated full access task_images" ON task_images FOR ALL TO authenticated USING (true);
