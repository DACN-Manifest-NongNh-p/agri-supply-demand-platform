# Local test accounts

One or more Keycloak accounts per Farmora role, for checking each area by hand. Local development only.
Every password is `Test@1234` (not temporary). Ids are fixed so they match the rows in
[`backend/db/seed/test_data.sql`](../../../backend/db/seed/test_data.sql).

| Username | Roles | What it is for |
| --- | --- | --- |
| `admin.quan` | ADMIN | Admin area: content, rules, products, announcements, Users page and Keycloak sync |
| `coord.ha` | COORDINATOR | Coordinator area (Le Thu Ha in the demo data) |
| `coord.khoa` | COORDINATOR | Coordinator who has never signed in (empty sign-in times on the Users page) |
| `producer.hoaphat` | PRODUCER | Producer area (Hoa Phat Dragon Fruit Cooperative) |
| `producer.thuannam` | PRODUCER | Second producer (Thuan Nam Mango Growers) |
| `producer.lamha` | PRODUCER | New sign-up, email not verified, never signed in |
| `buyer.greenbasket` | BUYER | Buyer area (GreenBasket Supermarkets) |
| `buyer.bepviet` | BUYER | Second buyer (Bep Viet restaurants) |
| `buyer.locked` | BUYER | Disabled account: Keycloak refuses the login |
| `logistics.delta` | LOGISTICS | Logistics area (Delta Cold Chain) |
| `logistics.southline` | LOGISTICS | Second carrier (SouthLine Logistics) |
| `coop.mientay` | PRODUCER, BUYER | Two roles: lands on `/producer`, can also open `/buyer` |
| `pending.norole` | none | Signed up but holds no Farmora role: every area shows "no access" |

## Import

The User Profile (`account_type`) must already be applied; see [setup](../../../docs/setup/README.md). Then, from the repo root:

```powershell
docker compose cp docker/keycloak/seed/test-users.json keycloak:/tmp/test-users.json
docker compose exec keycloak /opt/keycloak/bin/kcadm.sh config credentials --server http://localhost:8080 --realm master --user admin --password admin
docker compose exec keycloak /opt/keycloak/bin/kcadm.sh create partialImport -r agri-platform -f /tmp/test-users.json -o
Get-Content backend/db/seed/test_data.sql | docker compose exec -T app-db psql -U farmora -d farmora
```

Accounts that already exist are skipped, and the SQL can be re-run. The SQL also adds announcements
(one live per audience, plus a scheduled, an ended and a switched-off one that must not show) and a few
vegetable products, including a switched-off one.

To remove the accounts, delete them in the Keycloak admin console and run
`DELETE FROM app_user WHERE keycloak_id LIKE 'f0a7a000-%';`.
