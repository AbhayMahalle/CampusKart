-- Update products table to match requirements
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS title text,
ADD COLUMN IF NOT EXISTS seller_phone text,
ADD COLUMN IF NOT EXISTS approved boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS sold boolean DEFAULT false;

-- Update the existing name column to title if needed  
UPDATE public.products SET title = name WHERE title IS NULL;

-- Update flat_listings table to match requirements  
ALTER TABLE public.flat_listings
ADD COLUMN IF NOT EXISTS flat_type text,
ADD COLUMN IF NOT EXISTS contact_number text;

-- Update profiles table to act as users table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS role text DEFAULT 'user',
ADD COLUMN IF NOT EXISTS email text;

-- Create chats table for real-time messaging
CREATE TABLE IF NOT EXISTS public.chats (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id uuid NOT NULL,
  receiver_id uuid NOT NULL,
  product_id uuid,
  last_message text,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Update messages table to include chat_id
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS chat_id uuid,
ADD COLUMN IF NOT EXISTS timestamp timestamp with time zone DEFAULT now();

-- Enable RLS on new tables
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for chats
CREATE POLICY "Users can view their own chats" ON public.chats
FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can create chats" ON public.chats
FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their own chats" ON public.chats
FOR UPDATE USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Create storage bucket for images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies
CREATE POLICY "Images are publicly accessible" ON storage.objects
FOR SELECT USING (bucket_id = 'images');

CREATE POLICY "Users can upload images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Update products policies to include approval workflow
DROP POLICY IF EXISTS "Products are viewable by everyone" ON public.products;
CREATE POLICY "Approved products are viewable by everyone" ON public.products
FOR SELECT USING (approved = true OR auth.uid() = user_id);

-- Enable realtime for chats only (messages already enabled)
ALTER TABLE public.chats REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chats;