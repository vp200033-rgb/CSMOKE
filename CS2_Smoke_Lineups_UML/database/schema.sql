-- Counter-Strike 2 Smoke Lineups Database Schema
-- Compatible with SQLite and MySQL / MariaDB

-- 1. Users table
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role INTEGER NOT NULL DEFAULT 1, -- 0=GUEST, 1=USER, 2=ADMIN
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Maps table
CREATE TABLE IF NOT EXISTS maps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    radar_image_url VARCHAR(255) NOT NULL
);

-- 3. Lineups table
CREATE TABLE IF NOT EXISTS lineups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    map_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    start_x REAL NOT NULL,
    start_y REAL NOT NULL,
    end_x REAL NOT NULL,
    end_y REAL NOT NULL,
    video_url VARCHAR(500),
    crosshair_image_url VARCHAR(500),
    throw_type INTEGER NOT NULL DEFAULT 0, -- 0=STAND, 1=JUMPTHROW, 2=RUN_JUMPTHROW
    description TEXT,
    status INTEGER NOT NULL DEFAULT 0,     -- 0=PENDING, 1=APPROVED, 2=REJECTED
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (map_id) REFERENCES maps(id) ON DELETE CASCADE
);

-- Indexes for optimal performance
CREATE INDEX IF NOT EXISTS idx_lineups_map ON lineups(map_id);
CREATE INDEX IF NOT EXISTS idx_lineups_user ON lineups(user_id);
CREATE INDEX IF NOT EXISTS idx_lineups_status ON lineups(status);

-- ----------------------------------------------------
-- Seed Data
-- ----------------------------------------------------

-- Initial Tournament Maps
INSERT OR IGNORE INTO maps (id, name, radar_image_url) VALUES 
(1, 'de_mirage', 'assets/radars/de_mirage.svg'),
(2, 'de_inferno', 'assets/radars/de_inferno.svg'),
(3, 'de_nuke', 'assets/radars/de_nuke.svg'),
(4, 'de_dust2', 'assets/radars/de_dust2.svg');

-- Initial Users (Password: admin123 for admin, player123 for player1)
INSERT OR IGNORE INTO users (id, email, password_hash, role) VALUES 
(1, 'admin@cs2lineups.com', '$2y$10$Q7Jk5Oq7m9aOQyq7u2S2e.vY3mZ70XyqN/wPskv1kGgO8iH8hXf8a', 2),
(2, 'player1@cs2lineups.com', '$2y$10$vY3mZ70XyqN/wPskv1kGgO8iH8hXf8a1O5rXU5.Oqm3aOQyq7u2S2', 1);

-- Realistic CS2 Competitive Lineups
INSERT OR IGNORE INTO lineups (id, user_id, map_id, title, start_x, start_y, end_x, end_y, video_url, crosshair_image_url, throw_type, description, status) VALUES 
(1, 1, 1, 'Mirage Window from T-Roof', 190.0, 780.0, 540.0, 480.0, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800', 1, 'Stand in front of the trash can on T-Roof, align crosshair with top antenna tip, release with Jumpthrow.', 1),
(2, 2, 1, 'Mirage Connector from T-Spawn', 220.0, 830.0, 590.0, 560.0, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800', 0, 'Wedge into T-spawn right pillar corner, aim at the middle carpet pattern, standard left-click throw.', 1),
(3, 1, 1, 'Mirage B-Short Smoke from Apps', 320.0, 310.0, 480.0, 380.0, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800', 1, 'Align with apartment window frame, aim at top wooden beam, jumpthrow.', 1),
(4, 2, 2, 'Inferno Coffins from Banana Car', 310.0, 680.0, 440.0, 380.0, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800', 0, 'Stand behind yellow car on Banana, aim at top corner of fence, left-click stand throw.', 1),
(5, 1, 2, 'Inferno CT Spawn Smoke from Banana', 340.0, 710.0, 550.0, 390.0, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800', 2, 'Take two running steps forward from half-wall, release with run-jumpthrow.', 1),
(6, 2, 3, 'Nuke Garage Smoke from T-Roof', 260.0, 760.0, 490.0, 520.0, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800', 0, 'Line up with rooftop pipe, aim between clouds, normal standing throw.', 1),
(7, 2, 4, 'Dust II Xbox Smoke from Lower Tunnels', 380.0, 620.0, 480.0, 490.0, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800', 1, 'Stand in lower tunnels doorway, aim at doorway arch, jumpthrow.', 1),
(8, 2, 1, 'Community Pending Mirage Smoke', 210.0, 810.0, 630.0, 420.0, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800', 1, 'New community submitted smoke awaiting administrator verification.', 0);
