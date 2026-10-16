package com.agrisupply.platform.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.agrisupply.platform.domain.SiteContentEntry;

public interface SiteContentRepository extends JpaRepository<SiteContentEntry, String> {
}
