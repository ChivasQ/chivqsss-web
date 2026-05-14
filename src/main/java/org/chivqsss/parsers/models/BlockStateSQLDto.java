package org.chivqsss.parsers.models;

import com.fasterxml.jackson.annotation.JsonRawValue;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;

import java.util.Map;

public record BlockStateSQLDto(
        @JsonRawValue
        String properties,
        String model_name,
        Integer rot_x,
        Integer rot_y
) {}