package com.syncro.backend.domain.profile.entity;

public enum ZodiacSign {
    ARIES,
    TAURUS,
    GEMINI,
    CANCER,
    LEO,
    VIRGO,
    LIBRA,
    SCORPIO,
    SAGITTARIUS,
    CAPRICORN,
    AQUARIUS,
    PISCES,
    UNKNOWN;

    /**
     * Restituisce l'elemento associato al segno zodiacale.
     */
    public Element getElement() {
        return switch (this) {
            case ARIES, LEO, SAGITTARIUS -> Element.FIRE;
            case TAURUS, VIRGO, CAPRICORN -> Element.EARTH;
            case GEMINI, LIBRA, AQUARIUS -> Element.AIR;
            case CANCER, SCORPIO, PISCES -> Element.WATER;
            case UNKNOWN -> null;
        };
    }

    /**
     * Verifica se due segni hanno elementi compatibili.
     * Fuoco/Aria sono compatibili, Terra/Acqua sono compatibili.
     */
    public boolean isElementCompatible(ZodiacSign other) {
        if (this == UNKNOWN || other == UNKNOWN) {
            return false;
        }
        Element thisElement = this.getElement();
        Element otherElement = other.getElement();
        if (thisElement == null || otherElement == null) {
            return false;
        }
        return switch (thisElement) {
            case FIRE -> otherElement == Element.FIRE || otherElement == Element.AIR;
            case AIR -> otherElement == Element.AIR || otherElement == Element.FIRE;
            case EARTH -> otherElement == Element.EARTH || otherElement == Element.WATER;
            case WATER -> otherElement == Element.WATER || otherElement == Element.EARTH;
        };
    }

    public enum Element {
        FIRE,
        EARTH,
        AIR,
        WATER
    }
}
