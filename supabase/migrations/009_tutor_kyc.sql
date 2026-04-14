-- ============================================================
-- 009_tutor_kyc.sql
-- Adds Stripe Identity KYC fields to tutor_profiles.
-- Run after 004_tutor_marketplace.sql.
-- Down: ALTER TABLE tutor_profiles
--         DROP COLUMN kyc_verified,
--         DROP COLUMN stripe_identity_session_id;
-- ============================================================

ALTER TABLE tutor_profiles
  ADD COLUMN IF NOT EXISTS kyc_verified               BOOLEAN  NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS stripe_identity_session_id TEXT;

COMMENT ON COLUMN tutor_profiles.kyc_verified IS
  'TRUE once Stripe Identity has verified the tutor''s government ID + selfie. '
  'Set by the identity.verification_session.verified webhook event.';

COMMENT ON COLUMN tutor_profiles.stripe_identity_session_id IS
  'Most recent Stripe Identity VerificationSession ID. Used by webhook to match events.';
