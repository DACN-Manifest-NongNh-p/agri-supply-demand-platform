package com.agrisupply.platform.domain;

import java.math.BigDecimal;

/**
 * Operating rules an admin can change without a release. Each has a default, an allowed range,
 * and the text the admin page shows. The frontend reads the current values from /api/public/site.
 */
public enum PlatformRule {
    AUTO_MATCH_MIN_SCORE("autoMatchMinScore", "Auto-match score", "%",
            "Matches scoring at least this are held automatically; lower ones wait for a coordinator.", 75, 50, 100),
    SIGN_OFF_KG("signOffKg", "Sign-off quantity", "kg",
            "Holds of this many kilograms or more need a coordinator's approval.", 3000, 100, 100000),
    HOLD_HOURS("holdHours", "Hold length", "h",
            "Hours a producer has to confirm a hold before it lapses.", 24, 1, 168),
    HOLD_WARNING_HOURS("holdWarningHours", "Hold warning", "h",
            "Warn the producer, buyer and coordinator when a hold has this many hours or less left.", 6, 1, 48),
    DUE_SOON_DAYS("dueSoonDays", "Demand due soon", "days",
            "A demand needed within this many days and not fully sourced is flagged.", 3, 1, 30),
    SELL_SOON_DAYS("sellSoonDays", "Selling soon", "days",
            "Unsold kilograms within this many days of their sell-by date are listed first.", 3, 1, 30),
    COLD_CHAIN_MIN("coldChainMin", "Cold chain minimum", "°C",
            "Lowest safe temperature for refrigerated shipments.", 2, -10, 15),
    COLD_CHAIN_MAX("coldChainMax", "Cold chain maximum", "°C",
            "Highest safe temperature for refrigerated shipments.", 8, 0, 25);

    private final String key;
    private final String label;
    private final String unit;
    private final String description;
    private final BigDecimal defaultValue;
    private final BigDecimal min;
    private final BigDecimal max;

    PlatformRule(String key, String label, String unit, String description, int defaultValue, int min, int max) {
        this.key = key;
        this.label = label;
        this.unit = unit;
        this.description = description;
        this.defaultValue = BigDecimal.valueOf(defaultValue);
        this.min = BigDecimal.valueOf(min);
        this.max = BigDecimal.valueOf(max);
    }

    public static PlatformRule fromKey(String key) {
        for (PlatformRule rule : values()) {
            if (rule.key.equals(key)) {
                return rule;
            }
        }
        return null;
    }

    public boolean allows(BigDecimal value) {
        return value.compareTo(min) >= 0 && value.compareTo(max) <= 0;
    }

    public String getKey() {
        return key;
    }

    public String getLabel() {
        return label;
    }

    public String getUnit() {
        return unit;
    }

    public String getDescription() {
        return description;
    }

    public BigDecimal getDefaultValue() {
        return defaultValue;
    }

    public BigDecimal getMin() {
        return min;
    }

    public BigDecimal getMax() {
        return max;
    }
}
