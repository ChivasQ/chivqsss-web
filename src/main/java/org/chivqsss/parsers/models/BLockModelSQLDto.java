package org.chivqsss.parsers.models;

import com.fasterxml.jackson.annotation.JsonRawValue;

public record BLockModelSQLDto (
    @JsonRawValue
    String geometry
) {}
