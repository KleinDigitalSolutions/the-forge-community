-- ==========================================
-- MISSING TABLES FÜR SQUAD SYSTEM
-- Run this if you see errors about missing tables
-- ==========================================

-- VOTES TABLE (für Squad Decision-Making)
CREATE TABLE IF NOT EXISTS votes (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  squad_id TEXT NOT NULL REFERENCES squads(id) ON DELETE CASCADE,
  venture_id TEXT REFERENCES ventures(id) ON DELETE CASCADE,

  -- Question
  question TEXT NOT NULL,
  description TEXT,
  type VARCHAR(50) DEFAULT 'multiple-choice', -- multiple-choice, yes-no, ranking
  options TEXT[], -- For multiple choice

  -- Status
  status VARCHAR(50) DEFAULT 'open', -- open, closed
  deadline TIMESTAMP,

  -- Results
  required_quorum INTEGER DEFAULT 50, -- % of members required to vote
  winning_threshold INTEGER DEFAULT 50, -- % required to win
  winning_option TEXT,

  -- Metadata
  created_by TEXT REFERENCES "User"(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  closed_at TIMESTAMP
);

CREATE INDEX idx_votes_squad ON votes(squad_id);
CREATE INDEX idx_votes_status ON votes(status);

-- VOTE RESPONSES
CREATE TABLE IF NOT EXISTS vote_responses (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  vote_id TEXT NOT NULL REFERENCES votes(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,

  -- Response
  choice TEXT NOT NULL, -- For multiple choice
  comment TEXT,

  -- Metadata
  voted_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(vote_id, user_id)
);

CREATE INDEX idx_vote_responses_vote ON vote_responses(vote_id);
CREATE INDEX idx_vote_responses_user ON vote_responses(user_id);

-- ==========================================
-- DONE! Run this SQL in your Vercel Postgres
-- ==========================================

-- To run:
-- psql "YOUR_POSTGRES_URL" -f DATABASE-MISSING-TABLES.sql
