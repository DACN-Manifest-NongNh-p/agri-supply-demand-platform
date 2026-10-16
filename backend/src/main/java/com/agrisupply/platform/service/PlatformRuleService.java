package com.agrisupply.platform.service;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.agrisupply.platform.domain.PlatformRule;
import com.agrisupply.platform.domain.PlatformSetting;
import com.agrisupply.platform.dto.SiteDtos.RuleView;
import com.agrisupply.platform.repository.PlatformSettingRepository;

/** Operating rules: their current value (stored override or default) and safe updates. */
@Service
public class PlatformRuleService {

    private final PlatformSettingRepository repository;

    public PlatformRuleService(PlatformSettingRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<RuleView> rules() {
        Map<String, PlatformSetting> stored = new HashMap<>();
        repository.findAll().forEach(setting -> stored.put(setting.getKey(), setting));
        return Arrays.stream(PlatformRule.values()).map(rule -> {
            PlatformSetting setting = stored.get(rule.getKey());
            return new RuleView(rule.getKey(), rule.getLabel(), rule.getDescription(), rule.getUnit(),
                    setting == null ? rule.getDefaultValue() : setting.getValue(), rule.getDefaultValue(),
                    rule.getMin(), rule.getMax(),
                    setting == null ? null : setting.getUpdatedAt(), setting == null ? null : setting.getUpdatedBy());
        }).toList();
    }

    @Transactional
    public List<RuleView> update(Map<String, BigDecimal> values, String user) {
        Map<String, BigDecimal> next = new HashMap<>();
        rules().forEach(rule -> next.put(rule.key(), rule.value()));

        values.forEach((key, value) -> {
            PlatformRule rule = PlatformRule.fromKey(key);
            if (rule == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown rule: " + key);
            }
            if (value != null && !rule.allows(value)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        rule.getLabel() + " must be between " + rule.getMin().toPlainString() + " and " + rule.getMax().toPlainString() + " " + rule.getUnit());
            }
            next.put(key, value == null ? rule.getDefaultValue() : value);
        });

        // Rules that only make sense together.
        if (next.get(PlatformRule.COLD_CHAIN_MIN.getKey()).compareTo(next.get(PlatformRule.COLD_CHAIN_MAX.getKey())) >= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "The cold chain minimum must be below the maximum");
        }
        if (next.get(PlatformRule.HOLD_WARNING_HOURS.getKey()).compareTo(next.get(PlatformRule.HOLD_HOURS.getKey())) >= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "The hold warning must be shorter than the hold itself");
        }

        values.forEach((key, value) -> {
            PlatformRule rule = PlatformRule.fromKey(key);
            if (value == null || value.compareTo(rule.getDefaultValue()) == 0) {
                repository.deleteById(key);
            } else {
                PlatformSetting setting = repository.findById(key).orElseGet(() -> new PlatformSetting(key));
                setting.update(value, user);
                repository.save(setting);
            }
        });
        return rules();
    }
}
