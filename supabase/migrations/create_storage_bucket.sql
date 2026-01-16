-- Create storage bucket for images
INSERT INTO storage.buckets (id, name, public)
VALUES ('pintu-images', 'pintu-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies to allow public access for development
-- Policy for SELECT (Download)
CREATE POLICY "Give users access to own folder 1oj01k_0" ON storage.objects FOR SELECT TO public USING (bucket_id = 'pintu-images');

-- Policy for INSERT (Upload)
CREATE POLICY "Give users access to own folder 1oj01k_1" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'pintu-images');

-- Policy for UPDATE
CREATE POLICY "Give users access to own folder 1oj01k_2" ON storage.objects FOR UPDATE TO public USING (bucket_id = 'pintu-images');

-- Policy for DELETE
CREATE POLICY "Give users access to own folder 1oj01k_3" ON storage.objects FOR DELETE TO public USING (bucket_id = 'pintu-images');
