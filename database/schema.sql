-- Neighbourly Captive Portal & Ad Engine Database Schema
-- Target RDBMS: PostgreSQL

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. USERS & DEVICES (Identity Layer)
-- ==========================================

-- USERS
-- Represents a physical person who has authenticated via OTP.
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    marketing_consent BOOLEAN DEFAULT false,
    terms_accepted BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- DEVICES
-- Represents a physical device (smartphone, laptop) associated with a user.
CREATE TABLE IF NOT EXISTS devices (
    mac_address VARCHAR(17) PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    device_type VARCHAR(50), -- e.g., 'iOS', 'Android' (can be parsed from User-Agent)
    first_seen TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


-- ==========================================
-- 2. INFRASTRUCTURE & NETWORK (Access Layer)
-- ==========================================

-- ROUTERS (NAS)
-- The physical hardware providing the Wi-Fi in the neighborhoods.
CREATE TABLE IF NOT EXISTS routers (
    nas_id VARCHAR(50) PRIMARY KEY,
    neighborhood VARCHAR(100) NOT NULL, -- e.g., 'Soshanguve', 'Mamelodi'
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    status VARCHAR(20) DEFAULT 'active'
);

-- NETWORK SESSIONS
-- Log of network sessions granted after watching ads.
CREATE TABLE IF NOT EXISTS network_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mac_address VARCHAR(17) REFERENCES devices(mac_address),
    nas_id VARCHAR(50) REFERENCES routers(nas_id),
    tier_minutes INTEGER NOT NULL, -- The package chosen: 30, 90, 180
    bandwidth_mbps INTEGER DEFAULT 5,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE
);


-- ==========================================
-- 3. AD ENGINE (Monetization Layer)
-- ==========================================

-- AD CAMPAIGNS
-- The inventory of advertisements available to be shown.
CREATE TABLE IF NOT EXISTS ad_campaigns (
    id VARCHAR(50) PRIMARY KEY,
    advertiser_name VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    media_type VARCHAR(10) CHECK (media_type IN ('video', 'image')),
    media_url TEXT NOT NULL,
    duration_seconds INTEGER NOT NULL,
    target_neighborhood VARCHAR(100), -- Target specific NAS location, Nullable if global
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- AD IMPRESSIONS
-- The core monetization metric: logged every time a user watches an ad to unlock Wi-Fi.
CREATE TABLE IF NOT EXISTS ad_impressions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ad_id VARCHAR(50) REFERENCES ad_campaigns(id),
    mac_address VARCHAR(17) REFERENCES devices(mac_address),
    nas_id VARCHAR(50) REFERENCES routers(nas_id),
    watched_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 4. INDEXES (Performance)
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_devices_user_id ON devices(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_mac ON network_sessions(mac_address);
CREATE INDEX IF NOT EXISTS idx_impressions_ad ON ad_impressions(ad_id);
CREATE INDEX IF NOT EXISTS idx_impressions_mac ON ad_impressions(mac_address);
CREATE INDEX IF NOT EXISTS idx_impressions_time ON ad_impressions(watched_at);
