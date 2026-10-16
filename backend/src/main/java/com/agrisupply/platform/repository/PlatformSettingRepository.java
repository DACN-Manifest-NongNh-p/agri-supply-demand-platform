package com.agrisupply.platform.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.agrisupply.platform.domain.PlatformSetting;

public interface PlatformSettingRepository extends JpaRepository<PlatformSetting, String> {
}
