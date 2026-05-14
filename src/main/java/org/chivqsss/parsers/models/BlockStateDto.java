package org.chivqsss.parsers.models;

import com.google.gson.JsonElement;

import java.util.Map;

public record BlockStateDto(
        Map<String, JsonElement> variants
) {}