-- Sprint 2: Remove unique constraint on user_test_submissions to allow multiple submissions per test
DROP INDEX IF EXISTS ux_user_test_submission_unique;
