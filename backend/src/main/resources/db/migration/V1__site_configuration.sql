-- Site configuration an ADMIN edits in the app instead of in code.

-- Text on public pages (landing page). Only overrides are stored; the frontend has the defaults.
CREATE TABLE site_content (
    content_key VARCHAR(100) PRIMARY KEY,
    content_value TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by VARCHAR(100)
);

-- System announcements shown as a banner to chosen audiences, optionally for a time window.
CREATE TABLE announcement (
    id BIGSERIAL PRIMARY KEY,
    message VARCHAR(280) NOT NULL,
    tone VARCHAR(20) NOT NULL,
    -- Comma-separated audiences: PUBLIC, PRODUCER, BUYER, COORDINATOR, LOGISTICS.
    audiences VARCHAR(200) NOT NULL,
    starts_at TIMESTAMPTZ,
    ends_at TIMESTAMPTZ,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by VARCHAR(100)
);

-- Operating rules (thresholds used by matching, holds and alerts). Defaults and ranges live in code
-- (PlatformRule); only changed values are stored.
CREATE TABLE platform_setting (
    setting_key VARCHAR(60) PRIMARY KEY,
    setting_value NUMERIC(12, 2) NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by VARCHAR(100)
);

-- Product catalog producers declare and buyers ask for.
CREATE TABLE product (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(80) NOT NULL UNIQUE,
    name_vi VARCHAR(80),
    category VARCHAR(20) NOT NULL,
    cold_chain BOOLEAN NOT NULL DEFAULT FALSE,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by VARCHAR(100)
);

INSERT INTO product (name, name_vi, category, cold_chain, sort_order) VALUES
    ('Dragon fruit', 'Thanh long', 'FRUIT', TRUE, 10),
    ('Mango', 'Xoài', 'FRUIT', TRUE, 20),
    ('Pomelo', 'Bưởi', 'FRUIT', FALSE, 30),
    ('Avocado', 'Bơ', 'FRUIT', TRUE, 40),
    ('Durian', 'Sầu riêng', 'FRUIT', TRUE, 50),
    ('Rambutan', 'Chôm chôm', 'FRUIT', TRUE, 60),
    ('Longan', 'Nhãn', 'FRUIT', TRUE, 70),
    ('Lychee', 'Vải thiều', 'FRUIT', TRUE, 80),
    ('Mangosteen', 'Măng cụt', 'FRUIT', TRUE, 90),
    ('Banana', 'Chuối', 'FRUIT', FALSE, 100),
    ('Pineapple', 'Dứa', 'FRUIT', FALSE, 110);
