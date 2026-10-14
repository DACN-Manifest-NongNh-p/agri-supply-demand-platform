ARG KEYCLOAK_VERSION=26.3.3

FROM maven:3.9-eclipse-temurin-21 AS extensions
ARG KEYCLOAK_VERSION
WORKDIR /build
COPY extensions/role-assigner/pom.xml .
RUN mvn -q -B dependency:go-offline -Dkeycloak.version=${KEYCLOAK_VERSION}
COPY extensions/role-assigner/src src
RUN mvn -q -B package -Dkeycloak.version=${KEYCLOAK_VERSION}

FROM quay.io/keycloak/keycloak:${KEYCLOAK_VERSION}
COPY --from=extensions /build/target/farmora-role-assigner.jar /opt/keycloak/providers/
