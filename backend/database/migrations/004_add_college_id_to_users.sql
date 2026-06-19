-- Add college_id column to users table for College Admin user scoping
-- This allows users to be associated with a specific college

ALTER TABLE users
ADD COLUMN IF NOT EXISTS college_id UUID REFERENCES records(record_id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_college_id ON users(college_id);

-- Note: College Admin users should have college_id set to associate them with their college
-- The college_id references the record_id from the records table where module_key = 'institute_master'
