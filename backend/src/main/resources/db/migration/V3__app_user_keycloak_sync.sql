-- app_user can now also be filled from Keycloak's user list (not only at sign-in), so people who have
-- registered but never opened the app are listed too. Their sign-in times stay empty until they visit.
ALTER TABLE app_user
    ALTER COLUMN first_seen_at DROP NOT NULL,
    ALTER COLUMN first_seen_at DROP DEFAULT,
    ALTER COLUMN last_seen_at DROP NOT NULL,
    ALTER COLUMN last_seen_at DROP DEFAULT,
    -- Account switched on in Keycloak.
    ADD COLUMN enabled BOOLEAN NOT NULL DEFAULT TRUE,
    -- When the account was created in Keycloak.
    ADD COLUMN registered_at TIMESTAMPTZ,
    -- Last time the row was refreshed from Keycloak's user list.
    ADD COLUMN synced_at TIMESTAMPTZ;
