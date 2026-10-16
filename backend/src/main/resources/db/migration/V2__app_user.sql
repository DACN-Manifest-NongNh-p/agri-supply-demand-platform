-- People who have signed in to Farmora, copied from their Keycloak token. Keycloak stays the source of
-- truth for logins, passwords and roles; this table lets the app refer to users and list them.
CREATE TABLE app_user (
    -- Keycloak user id (the token's "sub").
    keycloak_id VARCHAR(36) PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(200),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    -- What the user picked at sign-up: BUYER, PRODUCER or LOGISTICS (null for admin-created accounts).
    account_type VARCHAR(20),
    -- Comma-separated Farmora roles at the last sign-in: BUYER, PRODUCER, LOGISTICS, COORDINATOR, ADMIN.
    roles VARCHAR(200) NOT NULL DEFAULT '',
    first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX app_user_last_seen_idx ON app_user (last_seen_at DESC);
