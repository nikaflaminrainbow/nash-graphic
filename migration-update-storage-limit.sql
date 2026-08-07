-- Update bucket to 5MB limit
UPDATE storage.buckets 
SET file_size_limit = 5242880 
WHERE id = 'design-samples';
