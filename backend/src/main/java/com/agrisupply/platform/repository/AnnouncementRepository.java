package com.agrisupply.platform.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.agrisupply.platform.domain.Announcement;

public interface AnnouncementRepository extends JpaRepository<Announcement, Long> {

    List<Announcement> findAllByOrderByUpdatedAtDesc();

    List<Announcement> findByActiveTrue();
}
