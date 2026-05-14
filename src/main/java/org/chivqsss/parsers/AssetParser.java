package org.chivqsss.parsers;

import java.nio.file.*;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Stream;

public class AssetParser {
    public static List<Path> findJsonFiles(String dir_path) {
        Path modelsDir = Paths.get(dir_path);
        List<Path> files = new ArrayList<>();
        try (Stream<Path> paths = Files.walk(modelsDir)) {
            paths
                    .filter(Files::isRegularFile)
                    .filter(path -> path.toString().endsWith(".json"))
                    .forEach(files::add);
        } catch (Exception e) {
            e.printStackTrace();
        }

        return files;
    }

    public static Map<String, String> parseProperties(String variantString) {
        Map<String, String> properties = new HashMap<>();

        if (variantString.isEmpty() || variantString.equals("normal")) {
            return properties;
        }

        String[] pairs = variantString.split(",");
        for (String pair : pairs) {
            String[] keyValue = pair.split("=");
            if (keyValue.length == 2) {
                properties.put(keyValue[0], keyValue[1]);
            }
        }
        return properties;
    }
}