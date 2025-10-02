-- Add sample users, products, flat listings, and chats for demo purposes

-- Note: Sample user profiles will be created via the authentication trigger
-- We'll insert sample products, flats, wishlists, and chats

-- Sample Products
INSERT INTO public.products (id, user_id, name, title, description, price, category, image_url, seller_phone, is_available, approved, created_at)
VALUES
  -- User 1's products
  ('a0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Calculus Textbook', 'Calculus Early Transcendentals - 8th Edition', 'Barely used calculus textbook. Perfect condition with no markings. Great for Math 101/102 courses.', 45.00, 'Books', 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800', '+1234567890', true, true, NOW() - INTERVAL '5 days'),
  ('a0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Gaming Laptop', 'ASUS ROG Gaming Laptop - RTX 3060', 'High-performance gaming laptop. Perfect for CS students and gaming. 16GB RAM, 512GB SSD. 1 year old, excellent condition.', 899.99, 'Electronics', 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=800', '+1234567890', true, true, NOW() - INTERVAL '3 days'),
  ('a0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Study Desk', 'Wooden Study Desk with Drawers', 'Solid wood desk perfect for studying. Includes 3 drawers for storage. Dimensions: 120x60cm. Moving out sale!', 75.00, 'Furniture', 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=800', NULL, true, true, NOW() - INTERVAL '2 days'),
  
  -- User 2's products  
  ('a0000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000002', 'Bike - Mountain Bike', 'Trek Mountain Bike 26"', 'Great condition mountain bike. 21-speed gear system. Perfect for campus commute and weekend trails.', 180.00, 'Sports', 'https://images.unsplash.com/photo-1576435728678-68d0fbf94e91?w=800', '+9876543210', true, true, NOW() - INTERVAL '4 days'),
  ('a0000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000002', 'Chemistry Lab Coat', 'White Lab Coat - Size M', 'Standard chemistry lab coat. Worn only twice. Required for Chem 201.', 15.00, 'Clothing', 'https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=800', NULL, true, true, NOW() - INTERVAL '6 days'),
  ('a0000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000002', 'Mini Fridge', 'Compact Mini Refrigerator', 'Perfect for dorm rooms. 1.7 cu ft capacity. Energy efficient and quiet. Works perfectly!', 60.00, 'Appliances', 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=800', '+9876543210', true, true, NOW() - INTERVAL '1 day'),
  
  -- User 3's products
  ('a0000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000003', 'iPhone 12', 'iPhone 12 - 128GB Blue', 'Excellent condition iPhone 12. No scratches, battery health 89%. Includes charger and case.', 450.00, 'Electronics', 'https://images.unsplash.com/photo-1592286927505-c0d4c9ec67c6?w=800', '+5555555555', true, true, NOW() - INTERVAL '7 days'),
  ('a0000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000003', 'Office Chair', 'Ergonomic Office Chair', 'Comfortable ergonomic chair with lumbar support. Adjustable height and armrests. Black mesh back.', 85.00, 'Furniture', 'https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=800', NULL, true, true, NOW() - INTERVAL '8 days');

-- Sample Flat Listings
INSERT INTO public.flat_listings (id, user_id, title, description, location, rent, bedrooms, bathrooms, flat_type, available_from, contact_number, image_url, is_available, created_at)
VALUES
  ('b0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'Spacious 2BR Near Campus', 'Beautiful 2-bedroom apartment just 5 minutes walk from campus. Fully furnished with modern appliances. Quiet neighborhood, perfect for students.', 'Downtown Campus Area', 800.00, 2, 1, 'Apartment', CURRENT_DATE + INTERVAL '15 days', '+9876543210', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800', true, NOW() - INTERVAL '3 days'),
  ('b0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', 'Cozy Studio Apartment', 'Modern studio apartment with all amenities. High-speed internet included. Great for single student. Near library and cafes.', 'North Campus District', 550.00, 1, 1, 'Studio', CURRENT_DATE + INTERVAL '30 days', '+5555555555', 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800', true, NOW() - INTERVAL '5 days'),
  ('b0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Shared Room Available', 'Looking for 1 roommate to share a large 3BR apartment. Friendly atmosphere, common areas include living room and kitchen. All utilities included.', 'West Campus', 400.00, 3, 2, 'Shared', CURRENT_DATE + INTERVAL '7 days', '+1234567890', 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800', true, NOW() - INTERVAL '2 days');

-- Sample Wishlist entries (User 3 likes User 1's products)
INSERT INTO public.wishlist (user_id, product_id)
VALUES
  ('00000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000002'),
  ('00000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000004');

-- Sample Chats
INSERT INTO public.chats (id, sender_id, receiver_id, product_id, last_message, created_at, updated_at)
VALUES
  ('c0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', 'Is the laptop still available?', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '30 minutes'),
  ('c0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000004', 'Hi! Interested in the bike.', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day');

-- Sample Messages
INSERT INTO public.messages (chat_id, sender_id, receiver_id, message, created_at, read)
VALUES
  -- Chat 1 messages
  ('c0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Hi! Is the gaming laptop still available?', NOW() - INTERVAL '2 hours', true),
  ('c0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', 'Yes, it is! Are you interested?', NOW() - INTERVAL '1 hour 45 minutes', true),
  ('c0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Great! Can we meet tomorrow to check it out?', NOW() - INTERVAL '1 hour 30 minutes', true),
  ('c0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', 'Sure! How about 3 PM at the library?', NOW() - INTERVAL '30 minutes', false),
  
  -- Chat 2 messages
  ('c0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'Hi! Interested in the mountain bike. Is it still for sale?', NOW() - INTERVAL '1 day', true),
  ('c0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Yes! It''s in great condition. Would you like to see it?', NOW() - INTERVAL '1 day' + INTERVAL '15 minutes', true);