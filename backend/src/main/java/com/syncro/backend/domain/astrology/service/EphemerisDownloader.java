package com.syncro.backend.domain.astrology.service;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.List;
import java.util.concurrent.locks.ReentrantLock;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Downloads Swiss Ephemeris data files from the official repo if the target directory is empty or incomplete.
 * One-time per server: once files exist, {@link #hasRequiredFiles()} returns true and no further downloads occur.
 * All users share the same ephemeris directory; no per-user or per-request download.
 */
public class EphemerisDownloader {

    private static final Logger log = LoggerFactory.getLogger(EphemerisDownloader.class);
    private static final String BASE_URL = "https://github.com/aloistr/swisseph/raw/master/ephe";
    private static final List<String> REQUIRED_FILES = List.of(
        "sepl_00.se1", "sepl_06.se1", "sepl_12.se1", "sepl_18.se1", "sepl_24.se1", "sepl_30.se1",
        "sepl_36.se1", "sepl_42.se1", "sepl_48.se1", "sepl_54.se1", "sepl_60.se1", "sepl_66.se1",
        "semo_00.se1", "semo_06.se1", "semo_12.se1", "semo_18.se1", "semo_24.se1", "semo_30.se1",
        "semo_36.se1", "semo_42.se1", "semo_48.se1", "semo_54.se1", "semo_60.se1", "semo_66.se1"
    );

    private final Path targetDir;
    private final ReentrantLock lock = new ReentrantLock();

    public EphemerisDownloader(Path targetDir) {
        this.targetDir = targetDir;
    }

    /**
     * Ensures the ephemeris directory exists and contains required files. If not, downloads them.
     */
    public void ensureEphemerisFiles() {
        lock.lock();
        try {
            if (hasRequiredFiles()) {
                return;
            }
            try {
                Files.createDirectories(targetDir);
            } catch (IOException e) {
                log.warn("Could not create ephemeris directory {}: {}", targetDir, e.getMessage());
                return;
            }
            log.info("Ephemeris directory empty or incomplete. Downloading Swiss Ephemeris data files...");
            int ok = 0;
            for (String fileName : REQUIRED_FILES) {
                if (downloadFile(fileName)) {
                    ok++;
                }
            }
            log.info("Ephemeris download complete: {} of {} files.", ok, REQUIRED_FILES.size());
        } finally {
            lock.unlock();
        }
    }

    private boolean hasRequiredFiles() {
        if (!Files.isDirectory(targetDir)) {
            return false;
        }
        boolean hasPlanet = false;
        boolean hasMoon = false;
        for (String name : REQUIRED_FILES) {
            if (Files.isRegularFile(targetDir.resolve(name))) {
                if (name.startsWith("sepl_")) hasPlanet = true;
                if (name.startsWith("semo_")) hasMoon = true;
            }
        }
        return hasPlanet && hasMoon;
    }

    private boolean downloadFile(String fileName) {
        URI uri = URI.create(BASE_URL + "/" + fileName);
        Path dest = targetDir.resolve(fileName);
        try {
            HttpClient client = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(15))
                .followRedirects(HttpClient.Redirect.NORMAL)
                .build();
            HttpRequest request = HttpRequest.newBuilder(uri).timeout(Duration.ofSeconds(30)).GET().build();
            HttpResponse<Path> response = client.send(request, HttpResponse.BodyHandlers.ofFile(dest));
            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                return true;
            }
            log.warn("Failed to download {}: HTTP {}", fileName, response.statusCode());
            return false;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.warn("Failed to download {}: {}", fileName, e.getMessage());
            return false;
        } catch (IOException e) {
            log.warn("Failed to download {}: {}", fileName, e.getMessage());
            return false;
        }
    }
}
