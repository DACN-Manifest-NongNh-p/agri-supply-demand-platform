package com.agrisupply.keycloak;

import java.util.Set;

import org.jboss.logging.Logger;
import org.keycloak.events.Event;
import org.keycloak.events.EventListenerProvider;
import org.keycloak.events.EventType;
import org.keycloak.events.admin.AdminEvent;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.RealmModel;
import org.keycloak.models.RoleModel;
import org.keycloak.models.UserModel;

/**
 * Grants the realm role matching the {@code account_type} a user picked on the registration form.
 *
 * <p>Only self-service roles are granted, so registration can never yield ADMIN or COORDINATOR.
 * The role is granted once at registration; editing {@code account_type} later does not change roles.
 */
public class RoleAssignerEventListenerProvider implements EventListenerProvider {

    static final String ACCOUNT_TYPE_ATTRIBUTE = "account_type";
    static final Set<String> SELF_SERVICE_ROLES = Set.of("BUYER", "PRODUCER", "LOGISTICS");

    private static final Logger LOG = Logger.getLogger(RoleAssignerEventListenerProvider.class);

    private final KeycloakSession session;

    public RoleAssignerEventListenerProvider(KeycloakSession session) {
        this.session = session;
    }

    @Override
    public void onEvent(Event event) {
        if (event.getType() != EventType.REGISTER) return;

        RealmModel realm = session.realms().getRealm(event.getRealmId());
        UserModel user = realm == null ? null : session.users().getUserById(realm, event.getUserId());
        if (user == null) return;

        String accountType = user.getFirstAttribute(ACCOUNT_TYPE_ATTRIBUTE);
        if (accountType == null || !SELF_SERVICE_ROLES.contains(accountType)) {
            LOG.warnf("User %s registered without a valid account_type (%s); no role granted",
                    user.getUsername(), accountType);
            return;
        }

        RoleModel role = realm.getRole(accountType);
        if (role == null) {
            LOG.warnf("Realm role %s is missing in realm %s; no role granted to %s",
                    accountType, realm.getName(), user.getUsername());
            return;
        }

        user.grantRole(role);
        LOG.infof("Granted realm role %s to newly registered user %s", accountType, user.getUsername());
    }

    @Override
    public void onEvent(AdminEvent event, boolean includeRepresentation) {
    }

    @Override
    public void close() {
    }
}
