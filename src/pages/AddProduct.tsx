import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Package } from 'lucide-react';

export default function AddProduct() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    image_url: '',
    seller_phone: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validate phone number
    const phoneRegex = /^\+?[1-9]\d{9,14}$/;
    const cleanedPhone = formData.seller_phone.replace(/\s/g, '');
    
    if (!cleanedPhone || !phoneRegex.test(cleanedPhone)) {
      toast({
        title: "Invalid phone number",
        description: "Please enter a valid WhatsApp number with country code (e.g., +919876543210)",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('products')
        .insert({
          user_id: user.id,
          name: formData.name,
          description: formData.description,
          price: parseFloat(formData.price),
          category: formData.category || null,
          image_url: formData.image_url || null,
          seller_phone: cleanedPhone,
          approved: true,
          is_available: true
        });

      if (error) {
        console.error('Error creating product:', error);
        toast({
          title: "Error",
          description: "Failed to create product. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Product created!",
        description: "Your product has been listed successfully.",
      });

      navigate('/dashboard');
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Add New Product</h1>
        <p className="text-muted-foreground">
          List your item for sale on CampusKart
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Package className="w-5 h-5 text-primary" />
            <span>Product Details</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="iPhone 13, MacBook Pro, etc."
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Describe your item, its condition, and any relevant details..."
                rows={4}
                value={formData.description}
                onChange={handleInputChange}
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price ($)</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={formData.price}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  name="category"
                  placeholder="Electronics, Books, Furniture..."
                  value={formData.category}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="image_url">Image URL (optional)</Label>
              <Input
                id="image_url"
                name="image_url"
                type="url"
                placeholder="https://example.com/image.jpg"
                value={formData.image_url}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="seller_phone">WhatsApp Number *</Label>
              <Input
                id="seller_phone"
                name="seller_phone"
                type="tel"
                placeholder="+919876543210"
                value={formData.seller_phone}
                onChange={handleInputChange}
                required
                pattern="^\+?[1-9]\d{9,14}$"
                title="Enter phone number with country code (e.g., +919876543210)"
              />
              <p className="text-xs text-muted-foreground">
                Include country code (e.g., +91 for India). Buyers will contact you on WhatsApp.
              </p>
            </div>

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/dashboard')}
                className="flex-1"
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="hero"
                className="flex-1"
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                List Product
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}