-- Composite index for the most common query pattern: filter by source + locale on active rows,
-- sorted by newest. Covers the Viator browse path and general list queries.
CREATE INDEX IF NOT EXISTS idx_experiences_active_source_locale
    ON experiences (source, locale, created_at DESC)
    WHERE is_active = true OR is_active IS NULL;

-- Separate index for locale-only queries (All tab, no source filter).
CREATE INDEX IF NOT EXISTS idx_experiences_active_locale
    ON experiences (locale, created_at DESC)
    WHERE is_active = true OR is_active IS NULL;

-- Category filter index — used when categoryId is provided.
CREATE INDEX IF NOT EXISTS idx_experiences_category_id
    ON experiences (category_id)
    WHERE category_id IS NOT NULL;

-- Spatial indexes for bounding box pre-filter before haversine computation.
-- Allows PostgreSQL to skip rows outside the approximate lat/lng range
-- before computing the expensive acos/cos trigonometric formula.
CREATE INDEX IF NOT EXISTS idx_experiences_latitude
    ON experiences (latitude)
    WHERE latitude IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_experiences_longitude
    ON experiences (longitude)
    WHERE longitude IS NOT NULL;

COMMENT ON INDEX idx_experiences_active_source_locale IS 'Covers Viator/Google browse by (source, locale) on active rows ordered by newest.';
COMMENT ON INDEX idx_experiences_latitude IS 'Supports bounding box pre-filter for haversine spatial queries.';
COMMENT ON INDEX idx_experiences_longitude IS 'Supports bounding box pre-filter for haversine spatial queries.';
