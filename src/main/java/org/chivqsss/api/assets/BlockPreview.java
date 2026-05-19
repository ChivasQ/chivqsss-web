package org.chivqsss.api.assets;

import org.chivqsss.parsers.models.BLockModelSQLDto;
import org.chivqsss.parsers.models.BlockStateSQLDto;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.DataClassRowMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController()
@RequestMapping("/api/assets")
public class BlockPreview {
    private final JdbcTemplate jdbcTemplate;

    public BlockPreview(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @PostMapping("/preview")
    public ResponseEntity<String> putBlockModel(@RequestParam("name") String name, @RequestParam("preview") MultipartFile preview) {
        if (name == null || preview == null || preview.isEmpty()) return ResponseEntity.badRequest().build();
        String sql = "UPDATE blocks SET preview = ? WHERE model_name = ?";

        try {
            int status = jdbcTemplate.update(sql, preview.getBytes(), name);
            if (status <= 0) {
                return ResponseEntity.notFound().build();
            } else {
                return ResponseEntity.ok().build();
            }
        } catch (IOException e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
