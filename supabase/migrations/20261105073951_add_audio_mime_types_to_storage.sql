-- Add audio MIME types to event-media storage bucket
-- This allows uploading audio files (MP3, WAV, OGG, M4A) for background music

UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
  'image/jpeg',
  'image/png',
  'image/webp',
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/ogg',
  'audio/m4a'
]
WHERE name = 'event-media';
