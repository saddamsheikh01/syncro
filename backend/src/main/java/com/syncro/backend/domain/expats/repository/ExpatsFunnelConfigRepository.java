package com.syncro.backend.domain.expats.repository;

import com.syncro.backend.domain.expats.entity.ExpatsFunnelConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface ExpatsFunnelConfigRepository extends JpaRepository<ExpatsFunnelConfig, UUID> {

    Optional<ExpatsFunnelConfig> findByConfigKeyAndLanguageAndActiveTrue(String configKey, String language);

    Optional<ExpatsFunnelConfig> findByConfigKeyAndLanguageAndVersion(String configKey, String language, Integer version);

    @Query("SELECT COALESCE(MAX(c.version), 0) FROM ExpatsFunnelConfig c WHERE c.configKey = :configKey AND c.language = :language")
    int findMaxVersionByConfigKeyAndLanguage(@Param("configKey") String configKey, @Param("language") String language);

    @Modifying
    @Query("UPDATE ExpatsFunnelConfig c SET c.active = false WHERE c.configKey = :configKey AND c.language = :language AND c.active = true")
    void deactivateByConfigKeyAndLanguage(@Param("configKey") String configKey, @Param("language") String language);
}
