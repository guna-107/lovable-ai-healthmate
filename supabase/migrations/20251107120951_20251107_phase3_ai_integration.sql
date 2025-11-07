/*
  # Phase 3: AI Integration & Chatbot Database Schema

  1. New Tables
    - `chat_messages` - Persistent storage of conversation history with streaming support
    - `health_data_sync` - Synced health metrics from wearables (Google Fit/Fitbit)
    - `wearable_connections` - OAuth credentials and sync metadata for wearable devices
    - `ai_request_logs` - Analytics logging for all AI API calls and responses

  2. Security
    - Enable RLS on all tables
    - Users can only access their own chat messages and health data
    - Only authenticated users can sync wearable data

  3. Features
    - Timestamps for all records for timeline tracking
    - Conversation grouping for multi-turn chat management
    - Health data normalized for easy querying (steps, calories, heart rate, sleep)
    - AI request tracking for debugging and analytics
*/

-- Chat Messages Table
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id uuid NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  tokens_used int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own chat messages"
  ON chat_messages FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chat messages"
  ON chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_chat_messages_user_conversation ON chat_messages(user_id, conversation_id, created_at DESC);

-- Health Data Sync Table
CREATE TABLE IF NOT EXISTS health_data_sync (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data_type text NOT NULL CHECK (data_type IN ('steps', 'calories', 'heart_rate', 'sleep', 'distance')),
  value numeric NOT NULL,
  unit text NOT NULL,
  source text NOT NULL DEFAULT 'google_fit',
  sync_date date NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, data_type, sync_date, source)
);

ALTER TABLE health_data_sync ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own health data"
  ON health_data_sync FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own health data"
  ON health_data_sync FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_health_data_user_date ON health_data_sync(user_id, sync_date DESC, data_type);

-- Wearable Connections Table
CREATE TABLE IF NOT EXISTS wearable_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('google_fit', 'fitbit')),
  access_token text NOT NULL,
  refresh_token text,
  expires_at timestamptz,
  last_sync timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, provider)
);

ALTER TABLE wearable_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own wearable connections"
  ON wearable_connections FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wearable connections"
  ON wearable_connections FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own wearable connections"
  ON wearable_connections FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- AI Request Logs Table
CREATE TABLE IF NOT EXISTS ai_request_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_type text NOT NULL CHECK (request_type IN ('chat', 'food_analysis', 'recommendation')),
  model_used text NOT NULL DEFAULT 'gemini-2.5-flash',
  input_tokens int DEFAULT 0,
  output_tokens int DEFAULT 0,
  total_tokens int DEFAULT 0,
  response_time_ms int,
  status text NOT NULL DEFAULT 'success',
  error_message text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ai_request_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own AI request logs"
  ON ai_request_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own AI request logs"
  ON ai_request_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_ai_logs_user_type ON ai_request_logs(user_id, request_type, created_at DESC);
CREATE INDEX idx_ai_logs_status ON ai_request_logs(status, created_at DESC);
