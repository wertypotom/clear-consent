-- Step 1: Enable the pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Step 2: Create a table for document sections
CREATE TABLE IF NOT EXISTS document_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id TEXT REFERENCES consent_forms(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  embedding VECTOR(3072) -- Upgraded to OpenAI text-embedding-3-large
);

-- Step 3: Create a function for similarity search
  query_embedding VECTOR(3072), -- Match 3072 dims
  match_threshold FLOAT,
  match_count INT,
  filter_form_id TEXT
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    document_sections.id,
    document_sections.content,
    1 - (document_sections.embedding <=> query_embedding) AS similarity
  FROM document_sections
  WHERE document_sections.form_id = filter_form_id
    AND 1 - (document_sections.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;

-- Step 4: Create a table for chat audit logs
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT REFERENCES patient_sessions(id) ON DELETE CASCADE, -- Changed to TEXT
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

/* 
-- MANUAL MIGRATION SCRIPT FOR SUPABASE SQL EDITOR --
-- Run these three lines if you already created the tables:

ALTER TABLE document_sections ALTER COLUMN embedding TYPE VECTOR(3072);

DROP FUNCTION IF EXISTS match_document_sections(vector(1536), float, int, text);

CREATE OR REPLACE FUNCTION match_document_sections (
  query_embedding VECTOR(3072),
  match_threshold FLOAT,
  match_count INT,
  filter_form_id TEXT
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    document_sections.id,
    document_sections.content,
    1 - (document_sections.embedding <=> query_embedding) AS similarity
  FROM document_sections
  WHERE document_sections.form_id = filter_form_id
    AND 1 - (document_sections.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;
*/
