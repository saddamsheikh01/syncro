package com.syncro.backend.domain.astrology.service;

import com.syncro.backend.domain.astrology.dto.AstrologyCalculationRequest;
import com.syncro.backend.domain.astrology.dto.AstrologyCalculationResponse;
import com.syncro.backend.domain.astrology.dto.PlacementDTO;
import com.syncro.backend.domain.profile.entity.ZodiacSign;
import java.nio.file.Path;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.util.concurrent.locks.ReentrantLock;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import swisseph.SweConst;
import swisseph.SwissEph;

/**
 * In-house astrology calculation using Swiss Ephemeris.
 * Reads ephemeris files from the configured path (planets + Moon). No external APIs.
 */
@Service
public class AstrologyCalculationService {

    private static final Logger log = LoggerFactory.getLogger(AstrologyCalculationService.class);

    private final String ephemerisPath;
    private final ReentrantLock lock = new ReentrantLock();
    private SwissEph swissEph;

    public AstrologyCalculationService(
        @Value("${app.astrology.ephemeris-path:./ephe}") String ephemerisPath
    ) {
        this.ephemerisPath = ephemerisPath != null ? ephemerisPath.trim() : "./ephe";
    }

    private SwissEph getSwissEph() {
        lock.lock();
        try {
            if (swissEph == null) {
                Path ephePath = Path.of(ephemerisPath).toAbsolutePath().normalize();
                new EphemerisDownloader(ephePath).ensureEphemerisFiles();
                String path = ephePath.toString().replace('\\', '/');
                swissEph = new SwissEph(path);
                log.info("Swiss Ephemeris initialized with path: {}", path);
            }
            return swissEph;
        } finally {
            lock.unlock();
        }
    }

    /**
     * Calculate Sun, Moon, Ascendant (if birth time present), Venus, Mars.
     * All positions from Swiss Ephemeris only. Ascendant from swe_houses(tjd_ut, lat, lon, Placidus).
     * When birth time is missing: Ascendant is not calculated (null) and hasBirthTime is false.
     * Birth time is LOCAL at place of birth; when birthTimezone (IANA) is provided, it is converted to UTC before JD.
     */
    public AstrologyCalculationResponse calculate(AstrologyCalculationRequest request) {
        SwissEph sw = getSwissEph();
        boolean hasTime = request.birthTime() != null;
        double tjdUt = toJulianDayUtFromRequest(sw, request, hasTime);
        double lat = request.birthLatitude();
        double lon = request.birthLongitude();
        int iflag = SweConst.SEFLG_SWIEPH;

        double[] xx = new double[6];
        StringBuilder serr = new StringBuilder();

        PlacementDTO sun = calcPlanet(sw, tjdUt, SweConst.SE_SUN, iflag, xx, serr);
        PlacementDTO moon = calcPlanet(sw, tjdUt, SweConst.SE_MOON, iflag, xx, serr);
        PlacementDTO venus = calcPlanet(sw, tjdUt, SweConst.SE_VENUS, iflag, xx, serr);
        PlacementDTO mars = calcPlanet(sw, tjdUt, SweConst.SE_MARS, iflag, xx, serr);

        PlacementDTO ascendant = null;
        if (hasTime) {
            double[] cusp = new double[13];
            double[] ascmc = new double[10];
            int ret = sw.swe_houses(tjdUt, iflag, lat, lon, SweConst.SE_HSYS_PLACIDUS, cusp, ascmc);
            if (ret >= 0) {
                double ascLong = sw.swe_degnorm(ascmc[SweConst.SE_ASC]);
                ascendant = longitudeToPlacement(ascLong);
            }
        }

        return new AstrologyCalculationResponse(
            sun,
            moon,
            ascendant,
            venus,
            mars,
            hasTime
        );
    }

    /**
     * Compute Julian day in UT for Swiss Ephemeris.
     * When birth time is present and birthTimezone (IANA) is set, (birthDate, birthTime) is interpreted as local
     * in that zone and converted to UTC. Otherwise birth time is treated as UTC (or noon UTC when no time given).
     */
    private double toJulianDayUtFromRequest(SwissEph sw, AstrologyCalculationRequest request, boolean hasTime) {
        if (!hasTime) {
            return toJulianDayUt(sw, request.birthDate(), LocalTime.NOON);
        }
        String tz = request.birthTimezone();
        if (tz != null && !tz.isBlank()) {
            ZonedDateTime local = ZonedDateTime.of(
                request.birthDate(),
                request.birthTime(),
                ZoneId.of(tz.trim())
            );
            ZonedDateTime utc = local.withZoneSameInstant(ZoneOffset.UTC);
            return toJulianDayUt(sw, utc.toLocalDate(), utc.toLocalTime());
        }
        return toJulianDayUt(sw, request.birthDate(), request.birthTime());
    }

    private static double toJulianDayUt(SwissEph sw, LocalDate date, LocalTime time) {
        int year = date.getYear();
        int month = date.getMonthValue();
        int day = date.getDayOfMonth();
        int hour = time.getHour();
        int min = time.getMinute();
        double sec = time.getSecond() + time.getNano() / 1_000_000_000.0;
        double hourDecimal = hour + min / 60.0 + sec / 3600.0;
        return sw.swe_julday(year, month, day, hourDecimal, SweConst.SE_GREG_CAL);
    }

    private PlacementDTO calcPlanet(SwissEph sw, double tjdUt, int ipl, int iflag, double[] xx, StringBuilder serr) {
        int ret = sw.swe_calc_ut(tjdUt, ipl, iflag, xx, serr);
        if (ret < 0) {
            int primaryRet = ret;
            String primaryErr = serr != null ? serr.toString() : "";
            if (serr != null) {
                serr.setLength(0);
            }
            int fallbackFlag = SweConst.SEFLG_MOSEPH;
            ret = sw.swe_calc_ut(tjdUt, ipl, fallbackFlag, xx, serr);
            if (ret < 0) {
                String fallbackErr = serr != null ? serr.toString() : "";
                log.warn(
                    "Swiss Ephemeris calc failed for planet {} (ret={}): {}. Moshier fallback failed (ret={}): {}",
                    ipl,
                    primaryRet,
                    primaryErr,
                    ret,
                    fallbackErr
                );
                return new PlacementDTO(ZodiacSign.UNKNOWN, 0);
            }
            log.warn(
                "Swiss Ephemeris data unavailable for planet {}. Using Moshier fallback. Original error: {}",
                ipl,
                primaryErr
            );
        }
        double longitude = sw.swe_degnorm(xx[0]);
        return longitudeToPlacement(longitude);
    }

    private static final ZodiacSign[] SIGNS_BY_INDEX = {
        ZodiacSign.ARIES, ZodiacSign.TAURUS, ZodiacSign.GEMINI, ZodiacSign.CANCER,
        ZodiacSign.LEO, ZodiacSign.VIRGO, ZodiacSign.LIBRA, ZodiacSign.SCORPIO,
        ZodiacSign.SAGITTARIUS, ZodiacSign.CAPRICORN, ZodiacSign.AQUARIUS, ZodiacSign.PISCES
    };

    private static PlacementDTO longitudeToPlacement(double longitudeDeg) {
        double norm = ((longitudeDeg % 360) + 360) % 360;
        int signIndex = (int) (norm / 30);
        if (signIndex >= 12) signIndex = 11;
        double degreeInSign = norm - signIndex * 30;
        ZodiacSign sign = SIGNS_BY_INDEX[signIndex];
        return new PlacementDTO(sign, degreeInSign);
    }
}
