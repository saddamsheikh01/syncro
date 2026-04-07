-- Sprint 2: Seed extended cost data for cities missing from V41

UPDATE relocation_city_dataset SET
    utilities_monthly = 162.00, mobile_plan_monthly = 15.00, internet_monthly = 25.00,
    meal_for_two_midrange = 40.00, gasoline_per_liter = 1.45, public_transport_monthly = 30.00,
    preschool_monthly = 350.00, international_school_annual = 8500.00
WHERE city_slug = 'budapest' AND utilities_monthly IS NULL;

UPDATE relocation_city_dataset SET
    utilities_monthly = 250.00, mobile_plan_monthly = 20.00, internet_monthly = 35.00,
    meal_for_two_midrange = 80.00, gasoline_per_liter = 2.10, public_transport_monthly = 65.00,
    preschool_monthly = 500.00, international_school_annual = 18000.00
WHERE city_slug = 'copenhagen' AND utilities_monthly IS NULL;

UPDATE relocation_city_dataset SET
    utilities_monthly = 190.00, mobile_plan_monthly = 20.00, internet_monthly = 30.00,
    meal_for_two_midrange = 70.00, gasoline_per_liter = 1.85, public_transport_monthly = 75.00,
    preschool_monthly = 800.00, international_school_annual = 20000.00
WHERE city_slug = 'paris' AND utilities_monthly IS NULL;

UPDATE relocation_city_dataset SET
    utilities_monthly = 180.00, mobile_plan_monthly = 12.00, internet_monthly = 20.00,
    meal_for_two_midrange = 30.00, gasoline_per_liter = 1.50, public_transport_monthly = 25.00,
    preschool_monthly = 400.00, international_school_annual = 12000.00
WHERE city_slug = 'prague' AND utilities_monthly IS NULL;

UPDATE relocation_city_dataset SET
    utilities_monthly = 200.00, mobile_plan_monthly = 10.00, internet_monthly = 18.00,
    meal_for_two_midrange = 35.00, gasoline_per_liter = 1.55, public_transport_monthly = 22.00,
    preschool_monthly = 450.00, international_school_annual = 14000.00
WHERE city_slug = 'warsaw' AND utilities_monthly IS NULL;
