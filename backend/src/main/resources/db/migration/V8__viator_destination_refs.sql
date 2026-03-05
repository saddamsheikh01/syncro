-- Viator destination references for experience sync (location-based search)
CREATE TABLE IF NOT EXISTS viator_destination_refs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    destination_ref VARCHAR(255) NOT NULL,
    city_name VARCHAR(255),
    enabled BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER NOT NULL DEFAULT 100,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_viator_destination_refs_destination_ref
    ON viator_destination_refs (LOWER(destination_ref));

COMMENT ON TABLE viator_destination_refs IS 'Viator destination refs for nearby experience sync (location-based search)';
