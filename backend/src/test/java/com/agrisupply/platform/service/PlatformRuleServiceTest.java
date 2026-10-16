package com.agrisupply.platform.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import com.agrisupply.platform.domain.PlatformSetting;
import com.agrisupply.platform.repository.PlatformSettingRepository;

class PlatformRuleServiceTest {

    private PlatformSettingRepository repository;
    private PlatformRuleService service;

    @BeforeEach
    void setUp() {
        repository = mock(PlatformSettingRepository.class);
        when(repository.findAll()).thenReturn(List.of());
        when(repository.findById(any())).thenReturn(Optional.empty());
        service = new PlatformRuleService(repository);
    }

    @Test
    void rulesWithoutAStoredValueUseTheirDefault() {
        assertThat(service.rules())
                .filteredOn(rule -> rule.key().equals("autoMatchMinScore"))
                .singleElement()
                .satisfies(rule -> assertThat(rule.value()).isEqualByComparingTo("75"));
    }

    @Test
    void storesAChangedValue() {
        service.update(Map.of("signOffKg", new BigDecimal("5000")), "farmora.admin");
        verify(repository).save(any(PlatformSetting.class));
    }

    @Test
    void settingTheDefaultRemovesTheOverride() {
        service.update(Map.of("holdHours", new BigDecimal("24")), "farmora.admin");
        verify(repository).deleteById("holdHours");
        verify(repository, never()).save(any());
    }

    @Test
    void rejectsValuesOutsideTheRange() {
        assertThatThrownBy(() -> service.update(Map.of("autoMatchMinScore", new BigDecimal("120")), "farmora.admin"))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("between 50 and 100");
    }

    @Test
    void rejectsUnknownRules() {
        assertThatThrownBy(() -> service.update(Map.of("nope", BigDecimal.ONE), "farmora.admin"))
                .isInstanceOf(ResponseStatusException.class);
    }

    @Test
    void rejectsAColdChainMinimumAboveTheMaximum() {
        assertThatThrownBy(() -> service.update(Map.of("coldChainMin", new BigDecimal("9")), "farmora.admin"))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("cold chain");
        verify(repository, never()).save(any());
    }

    @Test
    void rejectsAHoldWarningLongerThanTheHold() {
        assertThatThrownBy(() -> service.update(Map.of("holdHours", new BigDecimal("4")), "farmora.admin"))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("hold warning");
    }
}
