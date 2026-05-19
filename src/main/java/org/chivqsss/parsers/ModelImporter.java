package org.chivqsss.parsers;

import org.postgresql.util.PGobject;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
//
@Component
@Order(1)
public class ModelImporter implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    public ModelImporter(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(String... args) throws Exception {
        List<Path> models = AssetParser.findJsonFiles("D:/Trying to write a mod/chivqsss-web/src/main/resources/static/minecraft/models/block");

        for (Path model : models) {
            String jsonContent = Files.readString(model);

            String fileName = model.getFileName().toString().replace(".json", "");
            String name = "minecraft:block/" + fileName;

            PGobject jsonObject = new PGobject();
            jsonObject.setType("jsonb");
            jsonObject.setValue(jsonContent);

            String sql = "INSERT INTO models (name, geometry) VALUES (?, ?) ON CONFLICT (name) DO NOTHING";

            try {
                jdbcTemplate.update(sql, name, jsonObject);
                System.out.println("Saved: " + name);
            } catch (Exception e) {
                System.err.println("Err " + name + ": " + e.getMessage());
            }
        }
        System.out.println("Done");
    }
}