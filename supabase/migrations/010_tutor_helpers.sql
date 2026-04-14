-- ============================================================
-- 010_tutor_helpers.sql
-- RPC helpers called by application layer / webhooks.
--   increment_tutor_session_count  -- called on checkout.session.completed
--   update_tutor_pass_rate         -- called when session status -> completed
--   create_tutor_payout_record     -- called by admin payout trigger
CREATE OR REPLACE FUNCTION increment_tutor_session_count(p_tutor_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE tutor_profiles SET session_count=session_count+1,updated_at=NOW() WHERE profile_id=p_tutor_id;
END; $$;
CREATE OR REPLACE FUNCTION update_tutor_rating(p_tutor_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_count INTEGER; v_average NUMERIC(3,2);
BEGIN
  SELECT COUNT(*),ROUND(AVG(rating)::NUMERIC,2) INTO v_count,v_average FROM tutor_reviews WHERE tutor_id=p_tutor_id AND status='published';
  UPDATE tutor_profiles SET rating_average=v_average,rating_count=COALESCE(v,erage,0),updated_at=NOW() WHERE profile_id=p_tutor_id;
END; $$;
