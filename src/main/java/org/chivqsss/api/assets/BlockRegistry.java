package org.chivqsss.api.assets;

import org.chivqsss.parsers.models.BLockModelSQLDto;
import org.chivqsss.parsers.models.BlockDto;
import org.chivqsss.parsers.models.BlockStateSQLDto;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.jdbc.core.DataClassRowMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/assets")
public class BlockRegistry {
    private final JdbcTemplate jdbcTemplate;

    public BlockRegistry(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping("/blocks")
    @Cacheable("blocks_cache")
    public List<BlockDto> getBlockRegistry() {
        String sql = "SELECT name, model_name FROM blocks";

        return jdbcTemplate.query(sql, new DataClassRowMapper<>(BlockDto.class));
    }

    @GetMapping("/blockstate")
    @Cacheable("blockstates_cache")
    public List<BlockStateSQLDto> getBlockStates(@RequestParam("name") String name) {
        String sql = "SELECT properties::text, model_name, rot_x, rot_y FROM blockstates WHERE block_name = ?";

        return jdbcTemplate.query(sql, new DataClassRowMapper<>(BlockStateSQLDto.class), name);
    }

    @GetMapping("/def_blockstate")
    @Cacheable("def_blockstates_cache")
    public BlockStateSQLDto getDefaultBlockState(@RequestParam("id") String id) {
        String sql = "SELECT properties::text, model_name, rot_x, rot_y FROM blockstates WHERE id = ?";
        int int_id = Integer.parseInt(id);
        return jdbcTemplate.query(sql, new DataClassRowMapper<>(BlockStateSQLDto.class), int_id)
                .stream()
                .findFirst()
                .orElse(null);
    }

    @GetMapping("/block_model")
    @Cacheable("block_model_cache")
    public BLockModelSQLDto getBlockModel(@RequestParam("name") String name) {
        String sql = "SELECT geometry::text FROM models WHERE name = ?";
        return jdbcTemplate.query(sql, new DataClassRowMapper<>(BLockModelSQLDto.class), name)
                .stream()
                .findFirst()
                .orElse(null);
    }
}