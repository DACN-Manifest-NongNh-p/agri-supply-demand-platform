package com.agrisupply.platform.domain;

import java.util.Arrays;
import java.util.EnumSet;
import java.util.Set;
import java.util.stream.Collectors;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/** Stores a set of audiences as {@code "PRODUCER,BUYER"}. */
@Converter
public class AudienceSetConverter implements AttributeConverter<Set<Audience>, String> {

    @Override
    public String convertToDatabaseColumn(Set<Audience> audiences) {
        return audiences == null ? "" : audiences.stream().map(Enum::name).sorted().collect(Collectors.joining(","));
    }

    @Override
    public Set<Audience> convertToEntityAttribute(String column) {
        Set<Audience> audiences = EnumSet.noneOf(Audience.class);
        if (column == null || column.isBlank()) {
            return audiences;
        }
        Arrays.stream(column.split(",")).map(String::trim).filter(name -> !name.isEmpty()).map(Audience::valueOf).forEach(audiences::add);
        return audiences;
    }
}
