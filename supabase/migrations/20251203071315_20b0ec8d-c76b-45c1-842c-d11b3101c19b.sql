-- Update all existing products to be approved so they're visible
UPDATE products SET approved = true WHERE approved = false OR approved IS NULL;

-- Also set a better default for the approved column going forward
ALTER TABLE products ALTER COLUMN approved SET DEFAULT true;