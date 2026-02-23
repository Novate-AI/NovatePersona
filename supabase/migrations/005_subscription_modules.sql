-- Add module column to subscriptions for single-module plans
-- Values: 'novatutor', 'novaielts', 'novapatient', or NULL (for combo/free)
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS module text;

-- Update plan column comment: now stores 'free', 'single', or 'combo' instead of 'free'/'pro'
COMMENT ON COLUMN subscriptions.plan IS 'Plan type: free, single (one module), or combo (all modules)';
COMMENT ON COLUMN subscriptions.module IS 'For single plans: novatutor, novaielts, or novapatient. NULL for combo/free.';
