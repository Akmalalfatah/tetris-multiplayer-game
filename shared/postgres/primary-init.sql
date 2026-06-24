-- ============================================================
--  TETRIS MULTIPLAYER - Database Schema
--  Primary PostgreSQL Instance
-- ============================================================

-- Create replication user
CREATE USER replicator WITH REPLICATION ENCRYPTED PASSWORD 'replicator_secret';

-- Create separate database for user service (microservices pattern)
CREATE DATABASE tetris_users;

-- ── Users table (shared auth data) ──────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username    VARCHAR(30) UNIQUE NOT NULL,
    email       VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW(),
    last_login  TIMESTAMPTZ,
    is_active   BOOLEAN DEFAULT TRUE,
    is_banned   BOOLEAN DEFAULT FALSE
);

-- ── Sessions / JWT token tracking ───────────────────────────
CREATE TABLE IF NOT EXISTS sessions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token   TEXT NOT NULL,
    device_info     TEXT,
    ip_address      INET,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    expires_at      TIMESTAMPTZ NOT NULL,
    is_revoked      BOOLEAN DEFAULT FALSE
);

-- ── Game rooms / Matches ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS game_rooms (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_code   VARCHAR(8) UNIQUE NOT NULL,
    status      VARCHAR(20) DEFAULT 'waiting' CHECK (status IN ('waiting','playing','finished')),
    max_players INT DEFAULT 2,
    created_by  UUID REFERENCES users(id),
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    started_at  TIMESTAMPTZ,
    ended_at    TIMESTAMPTZ
);

-- ── Game participants ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS game_participants (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id     UUID NOT NULL REFERENCES game_rooms(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES users(id),
    score       INT DEFAULT 0,
    lines_cleared INT DEFAULT 0,
    level       INT DEFAULT 1,
    is_winner   BOOLEAN DEFAULT FALSE,
    joined_at   TIMESTAMPTZ DEFAULT NOW(),
    finished_at TIMESTAMPTZ,
    UNIQUE(room_id, user_id)
);

-- ── Leaderboard / Rankings ───────────────────────────────────
CREATE TABLE IF NOT EXISTS player_rankings (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID UNIQUE NOT NULL REFERENCES users(id),
    elo_rating  INT DEFAULT 1000,
    total_games INT DEFAULT 0,
    wins        INT DEFAULT 0,
    losses      INT DEFAULT 0,
    best_score  INT DEFAULT 0,
    total_lines INT DEFAULT 0,
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── Chat messages ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_messages (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id     UUID REFERENCES game_rooms(id) ON DELETE CASCADE,
    sender_id   UUID NOT NULL REFERENCES users(id),
    message     TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text','system','emoji')),
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── Matchmaking queue (for 2PC distributed transaction log) ──
CREATE TABLE IF NOT EXISTS transaction_log (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id  UUID NOT NULL,
    service_name    VARCHAR(50) NOT NULL,
    operation       VARCHAR(50) NOT NULL,
    status          VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','prepared','committed','aborted')),
    payload         JSONB,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── Indexes for performance ──────────────────────────────────
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expires ON sessions(expires_at) WHERE is_revoked = FALSE;
CREATE INDEX idx_game_participants_room ON game_participants(room_id);
CREATE INDEX idx_game_participants_user ON game_participants(user_id);
CREATE INDEX idx_player_rankings_elo ON player_rankings(elo_rating DESC);
CREATE INDEX idx_chat_messages_room ON chat_messages(room_id, created_at DESC);
CREATE INDEX idx_transaction_log_txid ON transaction_log(transaction_id);

-- ── Trigger: auto-create ranking row on user insert ──────────
CREATE OR REPLACE FUNCTION create_player_ranking()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO player_rankings (user_id) VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_user_created
AFTER INSERT ON users
FOR EACH ROW EXECUTE FUNCTION create_player_ranking();

-- ── Trigger: update updated_at ───────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER rankings_updated_at BEFORE UPDATE ON player_rankings
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── User service database setup ──────────────────────────────
\c tetris_users

CREATE TABLE IF NOT EXISTS user_profiles (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID UNIQUE NOT NULL,
    display_name    VARCHAR(50),
    avatar_url      TEXT,
    bio             TEXT,
    country         VARCHAR(2),
    preferred_level INT DEFAULT 1,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_stats (
    user_id         UUID PRIMARY KEY,
    games_played    INT DEFAULT 0,
    games_won       INT DEFAULT 0,
    total_score     BIGINT DEFAULT 0,
    total_lines     INT DEFAULT 0,
    max_combo       INT DEFAULT 0,
    tetris_count    INT DEFAULT 0,
    play_time_mins  INT DEFAULT 0,
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);