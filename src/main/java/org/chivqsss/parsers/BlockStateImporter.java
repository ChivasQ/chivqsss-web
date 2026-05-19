package org.chivqsss.parsers;

import com.google.gson.Gson;
import com.google.gson.JsonElement;
import org.chivqsss.parsers.models.BlockStateDto;
import org.chivqsss.parsers.models.VariantDto;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
@Order(2)
public class BlockStateImporter implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;
    private final Gson gson;

    public BlockStateImporter(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
        this.gson = new Gson();
    }

    @Override
    public void run(String... args) throws Exception {

        String blockstatesPath = "D:/Trying to write a mod/chivqsss-web/src/main/resources/static/minecraft/blockstates";
        List<Path> files = AssetParser.findJsonFiles(blockstatesPath);

        String deleteOldBlockSql = "TRUNCATE TABLE blockstates RESTART IDENTITY;";
        jdbcTemplate.update(deleteOldBlockSql);

        for (Path file : files) {
            String jsonContent = Files.readString(file);
            BlockStateDto stateDto = gson.fromJson(jsonContent, BlockStateDto.class);

            String blockName = "minecraft:" + file.getFileName().toString().replace(".json", "");
            String modelName = "minecraft:block/" + file.getFileName().toString().replace(".json", "");

            String insertBlockSql = "INSERT INTO blocks (name) VALUES (?) ON CONFLICT (name) DO NOTHING";
            jdbcTemplate.update(insertBlockSql, blockName);

            if (stateDto.variants() != null) {
                String insertStateSql = "INSERT INTO blockstates (block_name, properties, model_name, rot_x, rot_y) " +
                        "VALUES (?, ?::jsonb, ?, ?, ?)";

                for (Map.Entry<String, JsonElement> entry : stateDto.variants().entrySet()) {
                    String rawProperties = entry.getKey();
                    JsonElement variantElement = entry.getValue();

                    VariantDto variant;

                    if (variantElement.isJsonArray()) {
                        variant = gson.fromJson(variantElement.getAsJsonArray().get(0), VariantDto.class);
                    } else {
                        variant = gson.fromJson(variantElement, VariantDto.class);
                    }

                    Map<String, String> propertiesMap = parseProperties(rawProperties);
                    String propertiesJson = gson.toJson(propertiesMap);

                    int rotX = variant.x() != null ? variant.x() : 0;
                    int rotY = variant.y() != null ? variant.y() : 0;

                    jdbcTemplate.update(insertStateSql, blockName, propertiesJson, variant.model(), rotX, rotY);
                }
            }
        }

        String sql = "WITH DefaultStates AS (SELECT DISTINCT ON (block_name) block_name, id FROM blockstates ORDER BY block_name, rot_x ASC, rot_y ASC) UPDATE blocks b SET default_blockstate = ds.id FROM DefaultStates ds WHERE b.name = ds.block_name;";
        jdbcTemplate.update(sql);

    }

    private Map<String, String> parseProperties(String variantString) {
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