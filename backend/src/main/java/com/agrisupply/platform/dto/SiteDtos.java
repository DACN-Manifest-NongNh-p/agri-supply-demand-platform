package com.agrisupply.platform.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Set;

import com.agrisupply.platform.domain.Announcement;
import com.agrisupply.platform.domain.AnnouncementTone;
import com.agrisupply.platform.domain.Audience;
import com.agrisupply.platform.domain.Product;
import com.agrisupply.platform.domain.ProductCategory;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** Request and response bodies for the site configuration API. */
public final class SiteDtos {

    private SiteDtos() {
    }

    /** Everything the frontend needs at start-up, readable without signing in. */
    public record SiteBundle(
            Map<String, String> content,
            List<RuleView> rules,
            List<ProductView> products,
            List<AnnouncementView> announcements,
            Instant contentUpdatedAt) {
    }

    public record RuleView(String key, String label, String description, String unit,
                           BigDecimal value, BigDecimal defaultValue, BigDecimal min, BigDecimal max,
                           Instant updatedAt, String updatedBy) {
    }

    public record ProductView(Long id, String name, String nameVi, ProductCategory category,
                              boolean coldChain, boolean active, int sortOrder) {

        public static ProductView of(Product product) {
            return new ProductView(product.getId(), product.getName(), product.getNameVi(), product.getCategory(),
                    product.isColdChain(), product.isActive(), product.getSortOrder());
        }
    }

    public record AnnouncementView(Long id, String message, AnnouncementTone tone, Set<Audience> audiences,
                                   Instant startsAt, Instant endsAt, boolean active, boolean live,
                                   Instant updatedAt, String updatedBy) {

        public static AnnouncementView of(Announcement announcement, Instant now) {
            return new AnnouncementView(announcement.getId(), announcement.getMessage(), announcement.getTone(),
                    announcement.getAudiences(), announcement.getStartsAt(), announcement.getEndsAt(),
                    announcement.isActive(), announcement.isLive(now), announcement.getUpdatedAt(), announcement.getUpdatedBy());
        }
    }

    /** Content keys to set; an empty or null value removes the override (back to the default text). */
    public record ContentUpdate(@NotNull Map<String, String> values) {
    }

    /** Rule keys to set; a null value resets the rule to its default. */
    public record RulesUpdate(@NotNull Map<String, BigDecimal> values) {
    }

    public record AnnouncementRequest(
            @NotBlank @Size(max = 280) String message,
            @NotNull AnnouncementTone tone,
            @NotEmpty Set<Audience> audiences,
            Instant startsAt,
            Instant endsAt,
            boolean active) {
    }

    public record ProductRequest(
            @NotBlank @Size(max = 80) String name,
            @Size(max = 80) String nameVi,
            @NotNull ProductCategory category,
            boolean coldChain,
            boolean active,
            @Min(0) @Max(100000) int sortOrder) {
    }
}
