package com.syncro.backend.domain.analytics.entity;

import java.io.Serializable;
import java.util.Objects;

public class AnalyticsEventDefinitionId implements Serializable {

    private String eventName;
    private Integer eventVersion;

    public AnalyticsEventDefinitionId() {
    }

    public AnalyticsEventDefinitionId(String eventName, Integer eventVersion) {
        this.eventName = eventName;
        this.eventVersion = eventVersion;
    }

    public String getEventName() {
        return eventName;
    }

    public void setEventName(String eventName) {
        this.eventName = eventName;
    }

    public Integer getEventVersion() {
        return eventVersion;
    }

    public void setEventVersion(Integer eventVersion) {
        this.eventVersion = eventVersion;
    }

    @Override
    public boolean equals(Object other) {
        if (this == other) {
            return true;
        }
        if (!(other instanceof AnalyticsEventDefinitionId that)) {
            return false;
        }
        return Objects.equals(eventName, that.eventName)
            && Objects.equals(eventVersion, that.eventVersion);
    }

    @Override
    public int hashCode() {
        return Objects.hash(eventName, eventVersion);
    }
}
