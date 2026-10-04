-- Add commission tracking columns to orders table
-- Run this SQL script in your PostgreSQL database

-- Step 1: Add the column allowing NULL values first
ALTER TABLE orders ADD COLUMN IF NOT EXISTS commission_paid BOOLEAN;

-- Step 2: Update all existing rows to have false as default
UPDATE orders SET commission_paid = false WHERE commission_paid IS NULL;

-- Step 3: Now add the NOT NULL constraint
ALTER TABLE orders ALTER COLUMN commission_paid SET NOT NULL;

-- Step 4: Set the default for future inserts
ALTER TABLE orders ALTER COLUMN commission_paid SET DEFAULT false;

-- Add the commission_paid_at timestamp column
ALTER TABLE orders ADD COLUMN IF NOT EXISTS commission_paid_at TIMESTAMP;

-- Verify the columns were added
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND column_name IN ('commission_paid', 'commission_paid_at');
