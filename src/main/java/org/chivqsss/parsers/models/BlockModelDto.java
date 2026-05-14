package org.chivqsss.parsers.models;

import com.google.gson.annotations.SerializedName;

import java.util.Map;

public record BlockModelDto(
        String parent,

        Map<String, String> textures,

        @SerializedName("ambientocclusion")
        Boolean ambientOcclusion
) {}