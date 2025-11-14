-- Drop chat-related tables
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.chats CASCADE;

-- Update existing records with null phone numbers to empty string (they'll need to add it)
UPDATE public.profiles SET phone = '' WHERE phone IS NULL;
UPDATE public.products SET seller_phone = '' WHERE seller_phone IS NULL;
UPDATE public.flat_listings SET contact_number = '' WHERE contact_number IS NULL;

-- Now make phone fields required
ALTER TABLE public.profiles 
ALTER COLUMN phone SET NOT NULL,
ALTER COLUMN phone SET DEFAULT '';

ALTER TABLE public.products 
ALTER COLUMN seller_phone SET NOT NULL,
ALTER COLUMN seller_phone SET DEFAULT '';

ALTER TABLE public.flat_listings 
ALTER COLUMN contact_number SET NOT NULL,
ALTER COLUMN contact_number SET DEFAULT '';