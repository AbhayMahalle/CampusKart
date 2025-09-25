-- Drop foreign key constraints from wishlist and messages tables
ALTER TABLE public.wishlist DROP CONSTRAINT IF EXISTS wishlist_user_id_fkey;
ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_sender_id_fkey;
ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_receiver_id_fkey;

-- Now insert demo data without constraint issues
INSERT INTO public.products (user_id, name, description, price, image_url, category, is_available) VALUES
('11111111-1111-1111-1111-111111111111', 'Casio Calculator', 'Scientific calculator in excellent condition. Perfect for engineering and math courses.', 500, 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=500&h=500&fit=crop', 'Electronics', true),
('22222222-2222-2222-2222-222222222222', 'HC Verma Physics Book', 'Complete set of HC Verma physics books. Concepts of Physics Part 1 & 2. Minimal highlighting.', 250, 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=500&h=500&fit=crop', 'Books', true),
('11111111-1111-1111-1111-111111111111', 'Boat Headphones', 'Wireless Bluetooth headphones with excellent sound quality. Used for 6 months.', 1200, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop', 'Electronics', true),
('22222222-2222-2222-2222-222222222222', 'Study Table', 'Wooden study table in good condition. Perfect for dorm room or apartment.', 800, 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500&h=500&fit=crop', 'Furniture', true),
('33333333-3333-3333-3333-333333333333', 'Programming Books Bundle', 'Collection of programming books including Java, Python, and Data Structures.', 600, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&h=500&fit=crop', 'Books', true),
('33333333-3333-3333-3333-333333333333', 'Laptop Stand', 'Adjustable aluminum laptop stand. Ergonomic design for better posture.', 400, 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500&h=500&fit=crop', 'Electronics', true),
('44444444-4444-4444-4444-444444444444', 'Backpack', 'Large capacity backpack perfect for college students. Multiple compartments.', 350, 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&h=500&fit=crop', 'Accessories', true),
('44444444-4444-4444-4444-444444444444', 'Desk Lamp', 'LED desk lamp with adjustable brightness. Perfect for late-night study sessions.', 300, 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=500&h=500&fit=crop', 'Electronics', true);

-- Insert flat listings  
INSERT INTO public.flat_listings (user_id, title, location, rent, description, bedrooms, bathrooms, available_from, is_available) VALUES
('55555555-5555-5555-5555-555555555555', '2BHK Near College', 'Pune, Maharashtra', 7500, 'Spacious 2BHK apartment just 5 minutes walk from MIT College. Fully furnished with WiFi, kitchen facilities, and parking space.', 2, 2, '2024-01-01', true),
('66666666-6666-6666-6666-666666666666', 'PG for Girls', 'MIT Area, Pune', 6500, 'Safe and comfortable PG accommodation for female students. Includes meals, laundry, and 24/7 security. Walking distance to campus.', 1, 1, '2024-01-15', true),
('77777777-7777-7777-7777-777777777777', 'Shared Apartment', 'Stanford Campus', 4000, 'Looking for a roommate to share a 2BHK apartment near Stanford University. Rent includes utilities and internet.', 2, 1, '2024-02-01', true),
('88888888-8888-8888-8888-888888888888', '1BHK Furnished Flat', 'Cambridge, MA', 8000, 'Modern 1BHK apartment near Harvard campus. Fully furnished with modern amenities and high-speed internet.', 1, 1, '2024-02-15', true);

-- Insert wishlist items (linking to existing product IDs)
INSERT INTO public.wishlist (user_id, product_id) 
SELECT '99999999-9999-9999-9999-999999999999', id FROM public.products WHERE name = 'Casio Calculator' LIMIT 1;

INSERT INTO public.wishlist (user_id, product_id) 
SELECT '10101010-1010-1010-1010-101010101010', id FROM public.products WHERE name = 'HC Verma Physics Book' LIMIT 1;

-- Insert demo messages
INSERT INTO public.messages (sender_id, receiver_id, message) VALUES
('99999999-9999-9999-9999-999999999999', '11111111-1111-1111-1111-111111111111', 'Hey! Is the Casio calculator still available?'),
('11111111-1111-1111-1111-111111111111', '99999999-9999-9999-9999-999999999999', 'Yes! It is still available. Are you interested?'),
('99999999-9999-9999-9999-999999999999', '11111111-1111-1111-1111-111111111111', 'Great! Can we meet tomorrow to check it out?'),
('10101010-1010-1010-1010-101010101010', '22222222-2222-2222-2222-222222222222', 'Hi! I saw your HC Verma books listing. What is the condition?'),
('22222222-2222-2222-2222-222222222222', '10101010-1010-1010-1010-101010101010', 'The books are in excellent condition with minimal highlighting. Very well maintained!');