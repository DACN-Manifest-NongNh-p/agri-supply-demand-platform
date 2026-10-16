package com.agrisupply.platform.service;

import java.time.Instant;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Pattern;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.agrisupply.platform.domain.SiteContentEntry;
import com.agrisupply.platform.repository.SiteContentRepository;

/**
 * Public page text the admin changed. The frontend owns the list of editable keys and their
 * default text; only overrides are stored, so clearing a value restores the default.
 */
@Service
public class SiteContentService {

    private static final Pattern KEY = Pattern.compile("^[a-z][a-zA-Z0-9.]{1,99}$");
    private static final int MAX_LENGTH = 2000;

    private final SiteContentRepository repository;

    public SiteContentService(SiteContentRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public Map<String, String> overrides() {
        Map<String, String> values = new LinkedHashMap<>();
        repository.findAll().forEach(entry -> values.put(entry.getKey(), entry.getValue()));
        return values;
    }

    @Transactional(readOnly = true)
    public Optional<Instant> lastUpdated() {
        return repository.findAll().stream().map(SiteContentEntry::getUpdatedAt).max(Comparator.naturalOrder());
    }

    @Transactional
    public Map<String, String> update(Map<String, String> values, String user) {
        values.forEach((key, value) -> {
            if (!KEY.matcher(key).matches()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid content key: " + key);
            }
            if (value != null && value.length() > MAX_LENGTH) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, key + " is longer than " + MAX_LENGTH + " characters");
            }
        });
        values.forEach((key, value) -> {
            if (value == null || value.isBlank()) {
                repository.deleteById(key);
            } else {
                SiteContentEntry entry = repository.findById(key).orElseGet(() -> new SiteContentEntry(key));
                entry.update(value.strip(), user);
                repository.save(entry);
            }
        });
        return overrides();
    }
}
