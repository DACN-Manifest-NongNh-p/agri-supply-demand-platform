-- Local test data: one or more accounts per role, plus announcements and products to check them with.
-- Not a Flyway migration: run it by hand against a dev database, never against a shared or real one.
--
-- The accounts must also exist in Keycloak (it owns logins and roles). Import them first, with the same ids;
-- see docker/keycloak/seed/README.md. The API must have started once so Flyway has created the tables.
-- Then run this file:
--   docker compose exec -T app-db psql -U farmora -d farmora < backend/db/seed/test_data.sql
--
-- Every account's password is Test@1234. Re-running the file is safe.

BEGIN;

-- Accounts --------------------------------------------------------------------------------------------
-- keycloak_id matches the id in test-users.json, so signing in (GET /api/me) or the admin's
-- "Sync from Keycloak" updates these rows instead of adding new ones.
INSERT INTO app_user (keycloak_id, username, email, first_name, last_name, email_verified, account_type, roles,
                      enabled, registered_at, first_seen_at, last_seen_at, synced_at) VALUES
    -- ADMIN: second admin besides farmora.admin; edits content, rules, products, announcements, users.
    ('f0a7a000-0000-4000-8000-000000000101', 'admin.quan', 'quan.admin@farmora.test', 'Quan', 'Nguyen Minh', TRUE, NULL, 'ADMIN',
     TRUE, '2026-01-01 00:00+00', '2026-01-02 08:10+07', now() - interval '25 minutes', now() - interval '1 day'),
    -- COORDINATOR: Le Thu Ha, the coordinator in the frontend demo data; daily user.
    ('f0a7a000-0000-4000-8000-000000000201', 'coord.ha', 'ha.coordinator@farmora.test', 'Ha', 'Le Thu', TRUE, NULL, 'COORDINATOR',
     TRUE, '2026-01-02 00:00+00', '2026-01-02 09:00+07', now() - interval '2 hours', now() - interval '1 day'),
    -- COORDINATOR: created by an admin, has not signed in yet (empty sign-in times).
    ('f0a7a000-0000-4000-8000-000000000202', 'coord.khoa', 'khoa.coordinator@farmora.test', 'Khoa', 'Tran Dang', TRUE, NULL, 'COORDINATOR',
     TRUE, '2026-08-01 00:00+00', NULL, NULL, now() - interval '1 day'),
    -- PRODUCER: Hoa Phat Dragon Fruit Cooperative (Binh Thuan), the producer in the frontend demo data.
    ('f0a7a000-0000-4000-8000-000000000301', 'producer.hoaphat', 'hoaphat@farmora.test', 'Phat', 'Nguyen Van', TRUE, 'PRODUCER', 'PRODUCER',
     TRUE, '2026-01-16 00:00+00', '2026-01-16 07:30+07', now() - interval '40 minutes', now() - interval '1 day'),
    -- PRODUCER: Thuan Nam Mango Growers; signs in now and then.
    ('f0a7a000-0000-4000-8000-000000000302', 'producer.thuannam', 'thuannam@farmora.test', 'Lan', 'Huynh Thi', TRUE, 'PRODUCER', 'PRODUCER',
     TRUE, '2026-03-01 00:00+00', '2026-03-01 10:15+07', now() - interval '6 days', now() - interval '1 day'),
    -- PRODUCER: Lam Ha Avocado Cooperative; registered this week, email not verified, never opened the app.
    ('f0a7a000-0000-4000-8000-000000000303', 'producer.lamha', 'lamha@farmora.test', 'Bao', 'K''Ho', FALSE, 'PRODUCER', 'PRODUCER',
     TRUE, '2026-10-22 00:00+00', NULL, NULL, now() - interval '1 day'),
    -- BUYER: GreenBasket Supermarkets, the buyer in the frontend demo data.
    ('f0a7a000-0000-4000-8000-000000000401', 'buyer.greenbasket', 'greenbasket@farmora.test', 'Mai', 'Do Thi', TRUE, 'BUYER', 'BUYER',
     TRUE, '2026-02-01 00:00+00', '2026-02-01 14:00+07', now() - interval '3 hours', now() - interval '1 day'),
    -- BUYER: Bep Viet restaurant chain; smaller, occasional orders.
    ('f0a7a000-0000-4000-8000-000000000402', 'buyer.bepviet', 'bepviet@farmora.test', 'Duc', 'Pham Minh', TRUE, 'BUYER', 'BUYER',
     TRUE, '2026-05-01 00:00+00', '2026-05-01 11:20+07', now() - interval '2 days', now() - interval '1 day'),
    -- BUYER: switched off in Keycloak (cannot sign in); shows as disabled on the admin Users page.
    ('f0a7a000-0000-4000-8000-000000000403', 'buyer.locked', 'locked.buyer@farmora.test', 'Tam', 'Vu Thanh', TRUE, 'BUYER', 'BUYER',
     FALSE, '2026-02-16 00:00+00', '2026-02-16 09:00+07', '2026-06-30 17:45+07', now() - interval '1 day'),
    -- LOGISTICS: Delta Cold Chain, the carrier in the frontend demo data (refrigerated trucks).
    ('f0a7a000-0000-4000-8000-000000000501', 'logistics.delta', 'delta.dispatch@farmora.test', 'Tuan', 'Vo Quoc', TRUE, 'LOGISTICS', 'LOGISTICS',
     TRUE, '2026-01-20 00:00+00', '2026-01-20 08:00+07', now() - interval '1 hour', now() - interval '1 day'),
    -- LOGISTICS: SouthLine Logistics, the second carrier (regular trucks).
    ('f0a7a000-0000-4000-8000-000000000502', 'logistics.southline', 'southline.dispatch@farmora.test', 'Hung', 'Le Van', TRUE, 'LOGISTICS', 'LOGISTICS',
     TRUE, '2026-03-31 00:00+00', '2026-03-31 13:30+07', now() - interval '4 days', now() - interval '1 day'),
    -- PRODUCER + BUYER: Mien Tay co-op that grows and also buys; lands on /producer and can open /buyer.
    ('f0a7a000-0000-4000-8000-000000000601', 'coop.mientay', 'mientay.coop@farmora.test', 'Sang', 'Tran Van', TRUE, 'PRODUCER', 'BUYER,PRODUCER',
     TRUE, '2026-04-07 00:00+00', '2026-04-07 15:00+07', now() - interval '1 day', now() - interval '1 day'),
    -- No Farmora role (picked Buyer, but the role was never granted): every area shows "no access".
    ('f0a7a000-0000-4000-8000-000000000701', 'pending.norole', 'pending@farmora.test', 'Nhi', 'Ho Yen', TRUE, 'BUYER', '',
     TRUE, '2026-10-24 00:00+00', NULL, NULL, now() - interval '1 day')
ON CONFLICT (keycloak_id) DO UPDATE SET
    username = EXCLUDED.username,
    email = EXCLUDED.email,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    email_verified = EXCLUDED.email_verified,
    account_type = EXCLUDED.account_type,
    roles = EXCLUDED.roles,
    enabled = EXCLUDED.enabled,
    registered_at = EXCLUDED.registered_at,
    first_seen_at = EXCLUDED.first_seen_at,
    last_seen_at = EXCLUDED.last_seen_at,
    synced_at = EXCLUDED.synced_at;

-- Announcements ---------------------------------------------------------------------------------------
-- One live banner per audience, plus one each that must NOT show (scheduled, ended, switched off).
DELETE FROM announcement WHERE updated_by = 'seed';
INSERT INTO announcement (message, tone, audiences, starts_at, ends_at, active, updated_by) VALUES
    ('Farmora will be under maintenance on Sunday 01:00-03:00. Orders placed before then are not affected.',
     'INFO', 'PUBLIC', NULL, now() + interval '7 days', TRUE, 'seed'),
    ('Heavy rain expected in Binh Thuan this week: declare dragon fruit harvests early so we can book trucks.',
     'WARNING', 'COORDINATOR,PRODUCER', now() - interval '1 day', now() + interval '5 days', TRUE, 'seed'),
    ('Deposits are now 50% of the order value; the rest is paid on delivery.',
     'INFO', 'BUYER', now() - interval '3 days', NULL, TRUE, 'seed'),
    ('Cold-chain trucks must log temperatures every 30 minutes from today; trips outside 2-8 °C are flagged.',
     'URGENT', 'COORDINATOR,LOGISTICS', now() - interval '2 hours', now() + interval '2 days', TRUE, 'seed'),
    ('Coordinators: 3 holds over 3,000 kg are waiting for sign-off.',
     'WARNING', 'COORDINATOR', NULL, NULL, TRUE, 'seed'),
    -- Not live: starts tomorrow.
    ('Mid-autumn pomelo auction opens tomorrow at 08:00.',
     'INFO', 'BUYER,PRODUCER', now() + interval '1 day', now() + interval '4 days', TRUE, 'seed'),
    -- Not live: already ended.
    ('Tet price list has been published.',
     'INFO', 'BUYER,PRODUCER,PUBLIC', now() - interval '30 days', now() - interval '20 days', TRUE, 'seed'),
    -- Not live: switched off.
    ('Draft: new logistics partner onboarding.',
     'INFO', 'LOGISTICS', NULL, NULL, FALSE, 'seed');

-- Products --------------------------------------------------------------------------------------------
-- Vegetables and a switched-off product, so the catalog has more than fruit and the active filter shows.
INSERT INTO product (name, name_vi, category, cold_chain, active, sort_order, updated_by) VALUES
    ('Lettuce', 'Xà lách', 'VEGETABLE', TRUE, TRUE, 200, 'seed'),
    ('Tomato', 'Cà chua', 'VEGETABLE', FALSE, TRUE, 210, 'seed'),
    ('Sweet potato', 'Khoai lang', 'VEGETABLE', FALSE, TRUE, 220, 'seed'),
    ('Coffee beans', 'Cà phê nhân', 'OTHER', FALSE, TRUE, 300, 'seed'),
    ('Star apple', 'Vú sữa', 'FRUIT', TRUE, FALSE, 120, 'seed')
ON CONFLICT (name) DO NOTHING;

COMMIT;
