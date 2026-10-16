package com.agrisupply.platform.domain;

/** Who sees an announcement: visitors of the public pages, or signed-in users of one role's area. */
public enum Audience {
    PUBLIC,
    PRODUCER,
    BUYER,
    COORDINATOR,
    LOGISTICS
}
