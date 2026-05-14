package org.chivqsss.parsers.models;

public record VariantDto(
        String model,
        Integer x,
        Integer y,
        Boolean uvlock
) {}