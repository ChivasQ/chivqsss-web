package org.chivqsss.api.assets;

import org.chivqsss.parsers.models.BLockModelSQLDto;
import org.chivqsss.parsers.models.BlockStateSQLDto;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.DataClassRowMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.concurrent.TimeUnit;

@RestController()
@RequestMapping("/api/assets")
public class BlockPreview {
    private final JdbcTemplate jdbcTemplate;

    public BlockPreview(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @PostMapping("/put-preview")
    public ResponseEntity<String> putBlockPreview(@RequestParam("name") String name, @RequestParam("preview") MultipartFile preview) {
        if (name == null || preview == null || preview.isEmpty()) return ResponseEntity.badRequest().build();
        String sql = "UPDATE blocks SET preview = ? WHERE name = ?";

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

    @GetMapping("/preview")
    public ResponseEntity<byte[]> getBlockPreview(@RequestParam("name") String name) {
        if (name == null) return ResponseEntity.badRequest().build();
        String sql = "SELECT preview FROM blocks WHERE name = ?";
        try {
            byte[] image = jdbcTemplate.queryForObject(sql, byte[].class, name);
            if (image == null) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_TYPE, MediaType.IMAGE_PNG_VALUE)
                    .cacheControl(CacheControl.maxAge(365, TimeUnit.DAYS).cachePublic())
                    .body(image);
        } catch (EmptyResultDataAccessException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
