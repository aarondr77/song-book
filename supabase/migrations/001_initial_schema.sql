-- Create songs table
CREATE TABLE IF NOT EXISTS songs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  ultimate_guitar_id INTEGER UNIQUE NOT NULL,
  chords_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create songbooks table
CREATE TABLE IF NOT EXISTS songbooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create songbook_songs junction table
CREATE TABLE IF NOT EXISTS songbook_songs (
  songbook_id UUID NOT NULL REFERENCES songbooks(id) ON DELETE CASCADE,
  song_id UUID NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (songbook_id, song_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_songs_ultimate_guitar_id ON songs(ultimate_guitar_id);
CREATE INDEX IF NOT EXISTS idx_songbook_songs_songbook_id ON songbook_songs(songbook_id);
CREATE INDEX IF NOT EXISTS idx_songbook_songs_position ON songbook_songs(songbook_id, position);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_songbooks_updated_at BEFORE UPDATE ON songbooks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

