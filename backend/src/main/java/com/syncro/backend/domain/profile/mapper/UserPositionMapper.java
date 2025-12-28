package com.syncro.backend.domain.profile.mapper;

import com.syncro.backend.domain.profile.dto.UserPositionResponse;
import com.syncro.backend.domain.profile.entity.UserPosition;
import org.springframework.stereotype.Component;

@Component
public class UserPositionMapper {

    public UserPositionResponse toResponse(UserPosition position) {
        return new UserPositionResponse(
            position.getUserId(),
            position.getLatitude(),
            position.getLongitude(),
            position.getAccuracyMeters(),
            position.getUpdatedAt()
        );
    }
}
