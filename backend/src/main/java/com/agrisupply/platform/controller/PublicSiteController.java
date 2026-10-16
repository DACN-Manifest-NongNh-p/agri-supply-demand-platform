package com.agrisupply.platform.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.agrisupply.platform.dto.SiteDtos.SiteBundle;
import com.agrisupply.platform.service.AnnouncementService;
import com.agrisupply.platform.service.PlatformRuleService;
import com.agrisupply.platform.service.ProductService;
import com.agrisupply.platform.service.SiteContentService;

/** Site configuration everyone reads at start-up, signed in or not. */
@RestController
@RequestMapping("/api/public")
public class PublicSiteController {

    private final SiteContentService content;
    private final PlatformRuleService rules;
    private final ProductService products;
    private final AnnouncementService announcements;

    public PublicSiteController(SiteContentService content, PlatformRuleService rules, ProductService products, AnnouncementService announcements) {
        this.content = content;
        this.rules = rules;
        this.products = products;
        this.announcements = announcements;
    }

    /** Page text overrides, operating rules, the active product catalog and the live announcements. */
    @GetMapping("/site")
    public SiteBundle site() {
        return new SiteBundle(
                content.overrides(),
                rules.rules(),
                products.all().stream().filter(product -> product.active()).toList(),
                announcements.live(),
                content.lastUpdated().orElse(null));
    }
}
