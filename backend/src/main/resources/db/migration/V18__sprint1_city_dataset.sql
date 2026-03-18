-- Sprint 1: City dataset with raw fields + calculated macroaree

-- 6. City dataset (Level A: raw data from backoffice + Level B: 6 calculated macroaree)
CREATE TABLE IF NOT EXISTS relocation_city_dataset (
    id                              UUID PRIMARY KEY,
    city_name                       VARCHAR(255)    NOT NULL,
    city_slug                       VARCHAR(255)    NOT NULL UNIQUE,
    country                         VARCHAR(100)    NOT NULL,
    country_code                    VARCHAR(5)      NOT NULL,

    -- Social integration / work (scale 0-100)
    expat_community_index           DECIMAL(5,2)    NOT NULL,
    social_integration_index        DECIMAL(5,2)    NOT NULL,
    career_opportunity_index        DECIMAL(5,2)    NOT NULL,
    remote_work_ecosystem_index     DECIMAL(5,2)    NOT NULL,

    -- Cost of living (scale 0-100 or comparative index)
    rent_index                      DECIMAL(5,2)    NOT NULL,
    purchasing_power_index          DECIMAL(5,2)    NOT NULL,
    groceries_index                 DECIMAL(5,2)    NOT NULL,
    restaurant_index                DECIMAL(5,2)    NOT NULL,
    cost_of_living_ex_rent_index    DECIMAL(5,2)    NOT NULL,
    cost_of_living_inc_rent_index   DECIMAL(5,2)    NOT NULL,

    -- Real estate ratios (raw numeric)
    price_to_income_ratio           DECIMAL(8,2)    NOT NULL,
    price_to_rent_city_center_ratio DECIMAL(8,2)    NOT NULL,

    -- Quality of life (scale 0-100)
    safety_index                    DECIMAL(5,2)    NOT NULL,
    healthcare_index                DECIMAL(5,2)    NOT NULL,
    climate_index                   DECIMAL(5,2)    NOT NULL,
    pollution_index                 DECIMAL(5,2)    NOT NULL,
    traffic_commute_index           DECIMAL(5,2)    NOT NULL,

    -- Practical economic data (EUR)
    apartment_1br_center            DECIMAL(10,2)   NOT NULL,
    apartment_3br_center            DECIMAL(10,2)   NOT NULL,
    cost_single_no_rent             DECIMAL(10,2)   NOT NULL,
    cost_family_no_rent             DECIMAL(10,2)   NOT NULL,

    -- 6 calculated macroaree (Level B - derived from raw data, recalculated on insert/update)
    -- These are NEVER manually inserted; the Java service computes them.
    -- Percentile ranks for real estate ratios involve all active cities.
    macro_costo_vita                DECIMAL(5,2),
    macro_mercato_immobiliare       DECIMAL(5,2),
    macro_potere_economico          DECIMAL(5,2),
    macro_qualita_vita              DECIMAL(5,2),
    macro_opportunita_lavorative    DECIMAL(5,2),
    macro_integrazione_sociale      DECIMAL(5,2),

    -- Districts and metadata
    districts                       JSONB,
    active                          BOOLEAN         NOT NULL DEFAULT true,
    created_at                      TIMESTAMPTZ     NOT NULL,
    updated_at                      TIMESTAMPTZ     NOT NULL,
    created_by                      UUID            REFERENCES admin_users(id),
    updated_by                      UUID            REFERENCES admin_users(id)
);

COMMENT ON TABLE relocation_city_dataset IS 'City dataset managed via backoffice: ~21 raw fields (Level A) + 6 calculated macroaree (Level B)';
COMMENT ON COLUMN relocation_city_dataset.macro_costo_vita IS '(cost_of_living_ex_rent*0.5 + groceries*0.3 + restaurant*0.2) inverted: 100-raw';
COMMENT ON COLUMN relocation_city_dataset.macro_mercato_immobiliare IS '(rent_index*0.35 + cost_living_inc_rent*0.25 + pctile(p2i)*0.20 + pctile(p2r)*0.20) inverted: 100-raw';
COMMENT ON COLUMN relocation_city_dataset.macro_potere_economico IS 'purchasing_power_index direct';
COMMENT ON COLUMN relocation_city_dataset.macro_qualita_vita IS '(safety + healthcare + climate + (100-pollution) + (100-traffic)) / 5';
COMMENT ON COLUMN relocation_city_dataset.macro_opportunita_lavorative IS '(career_opportunity + remote_work_ecosystem) / 2';
COMMENT ON COLUMN relocation_city_dataset.macro_integrazione_sociale IS '(expat_community + social_integration) / 2';
COMMENT ON COLUMN relocation_city_dataset.districts IS 'Suggested districts: [{name, description}], managed via backoffice';

CREATE INDEX IF NOT EXISTS idx_city_dataset_slug ON relocation_city_dataset (city_slug);
CREATE INDEX IF NOT EXISTS idx_city_dataset_active ON relocation_city_dataset (active);

-- Add FK from relocation_profiles.target_city_id -> relocation_city_dataset
-- (relocation_profiles was created in V12, city_dataset now exists)
ALTER TABLE relocation_profiles
    ADD CONSTRAINT fk_relocation_profiles_target_city
    FOREIGN KEY (target_city_id) REFERENCES relocation_city_dataset(id);
