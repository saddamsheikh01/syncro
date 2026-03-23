-- Sprint 2: Extended cost data for Budget Simulator PREMIUM/SUPER_PRO
-- Source: DB ONBOARDING ENG.xlsx

ALTER TABLE relocation_city_dataset
    ADD COLUMN IF NOT EXISTS apartment_1br_outside NUMERIC(10,2),
    ADD COLUMN IF NOT EXISTS apartment_3br_outside NUMERIC(10,2),
    ADD COLUMN IF NOT EXISTS utilities_monthly NUMERIC(10,2),
    ADD COLUMN IF NOT EXISTS mobile_plan_monthly NUMERIC(10,2),
    ADD COLUMN IF NOT EXISTS internet_monthly NUMERIC(10,2),
    ADD COLUMN IF NOT EXISTS meal_for_two_midrange NUMERIC(10,2),
    ADD COLUMN IF NOT EXISTS gasoline_per_liter NUMERIC(10,2),
    ADD COLUMN IF NOT EXISTS public_transport_monthly NUMERIC(10,2),
    ADD COLUMN IF NOT EXISTS preschool_monthly NUMERIC(10,2),
    ADD COLUMN IF NOT EXISTS international_school_annual NUMERIC(10,2);
