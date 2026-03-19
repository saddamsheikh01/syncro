-- Seed the default Expats landing funnel configuration (expats_landing_v1, language=en)
-- Uses dollar-quoting to avoid escaping issues with apostrophes inside JSON strings.

INSERT INTO expats_funnel_configs (
    id,
    config_key,
    language,
    version,
    content,
    feature_flags,
    active,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'expats_landing_v1',
    'en',
    1,
    $content${
        "cta_text": "Get My Free Snapshot",
        "flow_config": {
            "total_steps": 10,
            "allow_back": true,
            "auto_save": true
        },
        "questions": [
            {
                "step": 1,
                "group": "CITY_FIT",
                "key": "user_phase",
                "title": "What Best Describes Your Current Situation?",
                "subtitle": "This helps us tailor your city compatibility analysis.",
                "options": [
                    {"value": "planning_move",  "label": "Planning a Move",         "emoji": "🧳"},
                    {"value": "recently_moved", "label": "Recently Moved",          "emoji": "📦"},
                    {"value": "already_there",  "label": "Already Living Abroad",   "emoji": "🌍"}
                ]
            },
            {
                "step": 2,
                "group": "CITY_FIT",
                "key": "target_city",
                "title": "Which City Are You Targeting?",
                "subtitle": "Or tell us if you are still exploring options.",
                "options": [
                    {"value": "specific_city", "label": "I Have a Specific City in Mind", "emoji": "📍"},
                    {"value": "not_sure",       "label": "Not Sure Yet",                  "emoji": "🗺️"},
                    {"value": "already_live",   "label": "I Already Live There",           "emoji": "🏠"}
                ]
            },
            {
                "step": 3,
                "group": "CITY_FIT",
                "key": "relocation_time",
                "title": "When Are You Planning to Move?",
                "options": [
                    {"value": "within_3_months",  "label": "Within 3 Months",  "emoji": "⚡"},
                    {"value": "within_6_months",  "label": "Within 6 Months",  "emoji": "📅"},
                    {"value": "within_12_months", "label": "Within a Year",     "emoji": "🗓️"},
                    {"value": "not_decided",       "label": "Not Decided Yet",   "emoji": "🤷"}
                ]
            },
            {
                "step": 4,
                "group": "CITY_FIT",
                "key": "household",
                "title": "Who Is Moving With You?",
                "options": [
                    {"value": "alone",         "label": "Moving Alone",    "emoji": "🙋"},
                    {"value": "with_partner",  "label": "With a Partner",  "emoji": "👫"},
                    {"value": "with_children", "label": "With Children",   "emoji": "👨‍👩‍👧"}
                ]
            },
            {
                "step": 5,
                "group": "CITY_FIT",
                "key": "age_range",
                "title": "What Is Your Age Range?",
                "options": [
                    {"value": "18_24",   "label": "18-24", "emoji": "🌱"},
                    {"value": "25_34",   "label": "25-34", "emoji": "🚀"},
                    {"value": "35_44",   "label": "35-44", "emoji": "💼"},
                    {"value": "45_54",   "label": "45-54", "emoji": "🎯"},
                    {"value": "55_plus", "label": "55+",   "emoji": "🌟"}
                ]
            },
            {
                "step": 6,
                "group": "POSITIONING",
                "key": "motivation",
                "title": "What Is Your Main Reason for Moving?",
                "options": [
                    {"value": "career",    "label": "Career & Opportunities", "emoji": "💼"},
                    {"value": "lifestyle", "label": "Better Lifestyle",        "emoji": "🌞"},
                    {"value": "remote",    "label": "Remote Work Freedom",     "emoji": "💻"},
                    {"value": "study",     "label": "Study",                   "emoji": "📚"},
                    {"value": "family",    "label": "Family & Stability",      "emoji": "👨‍👩‍👧"},
                    {"value": "reset",     "label": "Personal Reset",          "emoji": "🔄"}
                ]
            },
            {
                "step": 7,
                "group": "POSITIONING",
                "key": "work_type",
                "title": "What Is Your Work Situation?",
                "options": [
                    {"value": "remote",       "label": "100% Remote",          "emoji": "🌐"},
                    {"value": "local_job",    "label": "Looking for Local Job", "emoji": "🏢"},
                    {"value": "entrepreneur", "label": "Entrepreneur",          "emoji": "🚀"},
                    {"value": "student",      "label": "Student",               "emoji": "🎓"},
                    {"value": "not_working",  "label": "Not Working",           "emoji": "🌿"}
                ]
            },
            {
                "step": 8,
                "group": "POSITIONING",
                "key": "monthly_budget",
                "title": "What Is Your Monthly Budget?",
                "subtitle": "All-in cost including rent.",
                "options": [
                    {"value": "800",  "label": "Under 800 EUR",      "emoji": "💶"},
                    {"value": "1200", "label": "800 to 1200 EUR",    "emoji": "💶"},
                    {"value": "2000", "label": "1200 to 2000 EUR",   "emoji": "💶"},
                    {"value": "3000", "label": "2000 to 3000 EUR",   "emoji": "💶"},
                    {"value": "5000", "label": "3000 EUR or more",   "emoji": "💶"}
                ]
            },
            {
                "step": 9,
                "group": "EXECUTION",
                "key": "desired_lifestyle",
                "title": "What Lifestyle Are You Looking For?",
                "options": [
                    {"value": "essential",  "label": "Essential and Frugal",       "emoji": "🌱"},
                    {"value": "balanced",   "label": "Balanced and Comfortable",   "emoji": "⚖️"},
                    {"value": "comfort",    "label": "Comfortable and Quality",    "emoji": "✨"},
                    {"value": "experience", "label": "Premium Experiences",        "emoji": "🌟"}
                ]
            },
            {
                "step": 10,
                "group": "EXECUTION",
                "key": "need",
                "title": "What Is Your Biggest Priority Right Now?",
                "subtitle": "Your most pressing challenge to solve.",
                "options": [
                    {"value": "housing",              "label": "Find the Right Housing",        "emoji": "🏠"},
                    {"value": "neighborhood",         "label": "Choose the Right Neighborhood", "emoji": "📍"},
                    {"value": "cost_of_living",       "label": "Understand Cost of Living",     "emoji": "💰"},
                    {"value": "professional_network", "label": "Build a Professional Network",  "emoji": "🤝"},
                    {"value": "friendships",          "label": "Make Friends and Community",    "emoji": "👥"},
                    {"value": "schools_family",       "label": "Schools and Family Services",   "emoji": "🏫"},
                    {"value": "bureaucracy",          "label": "Visa and Bureaucracy",          "emoji": "📋"},
                    {"value": "career_opportunities", "label": "Find Career Opportunities",     "emoji": "💼"}
                ]
            }
        ]
    }$content$::jsonb,
    $flags${
        "show_budget_step": true,
        "enable_free_notes": true,
        "show_social_priority": true
    }$flags$::jsonb,
    true,
    now(),
    now()
) ON CONFLICT (config_key, language, version) DO NOTHING;
