-- Sprint 2: Seed extended cost data from DB ONBOARDING ENG.xlsx
-- Updates existing cities with utilities, transport, schools, dining data

UPDATE relocation_city_dataset SET
    apartment_1br_outside = 1020.00, apartment_3br_outside = 1629.55,
    utilities_monthly = 148.96, mobile_plan_monthly = 15.92, internet_monthly = 30.70,
    meal_for_two_midrange = 50.00, gasoline_per_liter = 1.78, public_transport_monthly = 40.00,
    preschool_monthly = 536.84, international_school_annual = 13992.19
WHERE city_slug = 'lisbon';

UPDATE relocation_city_dataset SET
    apartment_1br_outside = 816.47, apartment_3br_outside = 1417.59,
    utilities_monthly = 121.07, mobile_plan_monthly = 13.73, internet_monthly = 33.71,
    meal_for_two_midrange = 50.00, gasoline_per_liter = 1.72, public_transport_monthly = 40.00,
    preschool_monthly = 502.33, international_school_annual = 9198.33
WHERE city_slug = 'porto';

UPDATE relocation_city_dataset SET
    apartment_1br_outside = 1082.26, apartment_3br_outside = 1684.78,
    utilities_monthly = 156.32, mobile_plan_monthly = 16.62, internet_monthly = 33.85,
    meal_for_two_midrange = 60.00, gasoline_per_liter = 1.52, public_transport_monthly = 22.80,
    preschool_monthly = 651.11, international_school_annual = 13948.47
WHERE city_slug = 'barcelona';

UPDATE relocation_city_dataset SET
    apartment_1br_outside = 865.80, apartment_3br_outside = 1332.00,
    utilities_monthly = 139.73, mobile_plan_monthly = 15.47, internet_monthly = 33.40,
    meal_for_two_midrange = 60.00, gasoline_per_liter = 1.49, public_transport_monthly = 30.00,
    preschool_monthly = 536.36, international_school_annual = 8822.07
WHERE city_slug = 'valencia';

UPDATE relocation_city_dataset SET
    apartment_1br_outside = 995.80, apartment_3br_outside = 1539.58,
    utilities_monthly = 175.19, mobile_plan_monthly = 16.52, internet_monthly = 29.65,
    meal_for_two_midrange = 60.00, gasoline_per_liter = 1.58, public_transport_monthly = 35.00,
    preschool_monthly = 613.53, international_school_annual = 15318.00
WHERE city_slug = 'madrid';

UPDATE relocation_city_dataset SET
    apartment_1br_outside = 1036.92, apartment_3br_outside = 1843.75,
    utilities_monthly = 221.37, mobile_plan_monthly = 9.72, internet_monthly = 25.85,
    meal_for_two_midrange = 85.00, gasoline_per_liter = 1.78, public_transport_monthly = 39.00,
    preschool_monthly = 743.33, international_school_annual = 15874.74
WHERE city_slug = 'milan';

UPDATE relocation_city_dataset SET
    apartment_1br_outside = 822.73, apartment_3br_outside = 1595.45,
    utilities_monthly = 184.05, mobile_plan_monthly = 10.21, internet_monthly = 27.76,
    meal_for_two_midrange = 60.00, gasoline_per_liter = 1.69, public_transport_monthly = 35.00,
    preschool_monthly = 478.02, international_school_annual = 11784.29
WHERE city_slug = 'rome';

UPDATE relocation_city_dataset SET
    apartment_1br_outside = 532.31, apartment_3br_outside = 981.28,
    utilities_monthly = 173.86, mobile_plan_monthly = 23.01, internet_monthly = 29.28,
    meal_for_two_midrange = 60.00, gasoline_per_liter = 1.77, public_transport_monthly = 27.00,
    preschool_monthly = 554.46, international_school_annual = 11242.35
WHERE city_slug = 'athens';

UPDATE relocation_city_dataset SET
    apartment_1br_outside = 913.70, apartment_3br_outside = 1839.47,
    utilities_monthly = 338.09, mobile_plan_monthly = 17.39, internet_monthly = 43.36,
    meal_for_two_midrange = 60.00, gasoline_per_liter = 1.71, public_transport_monthly = 63.00,
    preschool_monthly = 118.44, international_school_annual = 10367.50
WHERE city_slug = 'berlin';

UPDATE relocation_city_dataset SET
    apartment_1br_outside = 7366.67, apartment_3br_outside = 7500.00,
    utilities_monthly = 378.33, mobile_plan_monthly = 37.33, internet_monthly = 55.25,
    meal_for_two_midrange = 80.00, gasoline_per_liter = 1.72, public_transport_monthly = 63.00,
    preschool_monthly = 821.61, international_school_annual = 13726.04
WHERE city_slug = 'munich';

UPDATE relocation_city_dataset SET
    apartment_1br_outside = 764.57, apartment_3br_outside = 1300.00,
    utilities_monthly = 292.33, mobile_plan_monthly = 13.33, internet_monthly = 31.50,
    meal_for_two_midrange = 80.00, gasoline_per_liter = 1.55, public_transport_monthly = 51.00,
    preschool_monthly = 312.00, international_school_annual = 24515.83
WHERE city_slug = 'vienna';

UPDATE relocation_city_dataset SET
    apartment_1br_outside = 1635.43, apartment_3br_outside = 2642.11,
    utilities_monthly = 263.77, mobile_plan_monthly = 19.83, internet_monthly = 48.00,
    meal_for_two_midrange = 80.00, gasoline_per_liter = 1.97, public_transport_monthly = 100.00,
    preschool_monthly = 2613.08, international_school_annual = 17766.82
WHERE city_slug = 'amsterdam';

UPDATE relocation_city_dataset SET
    apartment_1br_outside = 507.33, apartment_3br_outside = 912.96,
    utilities_monthly = 284.42, mobile_plan_monthly = 16.14, internet_monthly = 28.43,
    meal_for_two_midrange = 80.00, gasoline_per_liter = 1.58, public_transport_monthly = 30.00,
    preschool_monthly = 541.69, international_school_annual = 9155.08
WHERE city_slug = 'tallinn';

UPDATE relocation_city_dataset SET
    apartment_1br_outside = 1795.24, apartment_3br_outside = 2964.00,
    utilities_monthly = 221.23, mobile_plan_monthly = 18.12, internet_monthly = 46.62,
    meal_for_two_midrange = 90.00, gasoline_per_liter = 1.79, public_transport_monthly = 96.00,
    preschool_monthly = 1116.89, international_school_annual = 10382.40
WHERE city_slug = 'dublin';

UPDATE relocation_city_dataset SET
    apartment_1br_outside = 782.00, apartment_3br_outside = 1392.88,
    utilities_monthly = 112.27, mobile_plan_monthly = 25.94, internet_monthly = 22.56,
    meal_for_two_midrange = 90.00, gasoline_per_liter = 1.75, public_transport_monthly = 72.10,
    preschool_monthly = 441.11, international_school_annual = 12960.14
WHERE city_slug = 'helsinki';

UPDATE relocation_city_dataset SET
    apartment_1br_outside = 843.00, apartment_3br_outside = 1368.70,
    utilities_monthly = 92.88, mobile_plan_monthly = 23.62, internet_monthly = 30.83,
    meal_for_two_midrange = 75.00, gasoline_per_liter = 1.34, public_transport_monthly = 0.00,
    preschool_monthly = 355.65, international_school_annual = 9277.73
WHERE city_slug = 'malta';

UPDATE relocation_city_dataset SET
    apartment_1br_outside = 596.67, apartment_3br_outside = 890.40,
    utilities_monthly = 196.95, mobile_plan_monthly = 9.00, internet_monthly = 27.55,
    meal_for_two_midrange = 60.00, gasoline_per_liter = 1.80, public_transport_monthly = 38.27,
    preschool_monthly = 716.67, international_school_annual = 10400.00
WHERE city_slug = 'trieste';

UPDATE relocation_city_dataset SET
    apartment_1br_outside = 522.91, apartment_3br_outside = 839.50,
    utilities_monthly = 209.80, mobile_plan_monthly = 9.56, internet_monthly = 28.06,
    meal_for_two_midrange = 70.00, gasoline_per_liter = 1.76, public_transport_monthly = 48.00,
    preschool_monthly = 450.00, international_school_annual = 13030.00
WHERE city_slug = 'genova';
