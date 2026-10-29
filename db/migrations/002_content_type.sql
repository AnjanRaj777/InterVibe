-- Phase 1: track the uploaded file's MIME type for extraction.
ALTER TABLE documents ADD COLUMN IF NOT EXISTS content_type text NOT NULL DEFAULT 'text/plain';
