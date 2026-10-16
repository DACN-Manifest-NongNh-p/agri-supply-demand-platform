package com.agrisupply.platform.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.agrisupply.platform.dto.SiteDtos.AnnouncementRequest;
import com.agrisupply.platform.dto.SiteDtos.AnnouncementView;
import com.agrisupply.platform.dto.SiteDtos.ContentUpdate;
import com.agrisupply.platform.dto.SiteDtos.ProductRequest;
import com.agrisupply.platform.dto.SiteDtos.ProductView;
import com.agrisupply.platform.dto.SiteDtos.RuleView;
import com.agrisupply.platform.dto.SiteDtos.RulesUpdate;
import com.agrisupply.platform.service.AnnouncementService;
import com.agrisupply.platform.service.PlatformRuleService;
import com.agrisupply.platform.service.ProductService;
import com.agrisupply.platform.service.SiteContentService;

import jakarta.validation.Valid;

/** Changes to the site configuration. ADMIN only (also enforced in SecurityConfig). */
@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminSiteController {

    private final SiteContentService content;
    private final PlatformRuleService rules;
    private final ProductService products;
    private final AnnouncementService announcements;

    public AdminSiteController(SiteContentService content, PlatformRuleService rules, ProductService products, AnnouncementService announcements) {
        this.content = content;
        this.rules = rules;
        this.products = products;
        this.announcements = announcements;
    }

    @PutMapping("/content")
    public Map<String, String> updateContent(@Valid @RequestBody ContentUpdate request, Authentication user) {
        return content.update(request.values(), user.getName());
    }

    @PutMapping("/rules")
    public List<RuleView> updateRules(@Valid @RequestBody RulesUpdate request, Authentication user) {
        return rules.update(request.values(), user.getName());
    }

    @GetMapping("/announcements")
    public List<AnnouncementView> announcements() {
        return announcements.all();
    }

    @PostMapping("/announcements")
    @ResponseStatus(HttpStatus.CREATED)
    public AnnouncementView createAnnouncement(@Valid @RequestBody AnnouncementRequest request, Authentication user) {
        return announcements.create(request, user.getName());
    }

    @PutMapping("/announcements/{id}")
    public AnnouncementView updateAnnouncement(@PathVariable long id, @Valid @RequestBody AnnouncementRequest request, Authentication user) {
        return announcements.update(id, request, user.getName());
    }

    @DeleteMapping("/announcements/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteAnnouncement(@PathVariable long id) {
        announcements.delete(id);
    }

    /** Every product, including switched-off ones. */
    @GetMapping("/products")
    public List<ProductView> products() {
        return products.all();
    }

    @PostMapping("/products")
    @ResponseStatus(HttpStatus.CREATED)
    public ProductView createProduct(@Valid @RequestBody ProductRequest request, Authentication user) {
        return products.create(request, user.getName());
    }

    @PutMapping("/products/{id}")
    public ProductView updateProduct(@PathVariable long id, @Valid @RequestBody ProductRequest request, Authentication user) {
        return products.update(id, request, user.getName());
    }
}
