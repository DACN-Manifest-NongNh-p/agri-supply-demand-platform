package com.agrisupply.platform.service;

import java.time.Instant;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.agrisupply.platform.domain.Announcement;
import com.agrisupply.platform.dto.SiteDtos.AnnouncementRequest;
import com.agrisupply.platform.dto.SiteDtos.AnnouncementView;
import com.agrisupply.platform.repository.AnnouncementRepository;

@Service
public class AnnouncementService {

    private final AnnouncementRepository repository;

    public AnnouncementService(AnnouncementRepository repository) {
        this.repository = repository;
    }

    /** Announcements showing right now, for every audience; each area picks its own. */
    @Transactional(readOnly = true)
    public List<AnnouncementView> live() {
        Instant now = Instant.now();
        return repository.findByActiveTrue().stream().filter(item -> item.isLive(now)).map(item -> AnnouncementView.of(item, now)).toList();
    }

    @Transactional(readOnly = true)
    public List<AnnouncementView> all() {
        Instant now = Instant.now();
        return repository.findAllByOrderByUpdatedAtDesc().stream().map(item -> AnnouncementView.of(item, now)).toList();
    }

    @Transactional
    public AnnouncementView create(AnnouncementRequest request, String user) {
        return save(new Announcement(), request, user);
    }

    @Transactional
    public AnnouncementView update(long id, AnnouncementRequest request, String user) {
        Announcement announcement = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Announcement " + id + " not found"));
        return save(announcement, request, user);
    }

    @Transactional
    public void delete(long id) {
        if (!repository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Announcement " + id + " not found");
        }
        repository.deleteById(id);
    }

    private AnnouncementView save(Announcement announcement, AnnouncementRequest request, String user) {
        if (request.startsAt() != null && request.endsAt() != null && !request.endsAt().isAfter(request.startsAt())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "The end must be after the start");
        }
        announcement.update(request.message().strip(), request.tone(), request.audiences(), request.startsAt(), request.endsAt(), request.active(), user);
        return AnnouncementView.of(repository.save(announcement), Instant.now());
    }
}
