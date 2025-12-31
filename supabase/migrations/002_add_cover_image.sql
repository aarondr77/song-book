-- Add cover_image_url column to songbooks table
ALTER TABLE songbooks 
ADD COLUMN IF NOT EXISTS cover_image_url TEXT;

