package com.syncro.backend.domain.catalog.mapper;

import com.syncro.backend.domain.catalog.dto.AffiliationLinkResponse;
import com.syncro.backend.domain.catalog.entity.AffiliationLink;
import org.springframework.stereotype.Component;

@Component
public class AffiliationLinkMapper {

    public AffiliationLinkResponse toResponse(AffiliationLink link) {
        return new AffiliationLinkResponse(
            link.getId(),
            link.getUrl(),
            link.getProvider(),
            link.getCreatedAt()
        );
    }
}
