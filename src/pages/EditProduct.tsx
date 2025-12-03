import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ImageUpload } from '@/components/ImageUpload';
import { Loader2, Package, ArrowLeft } from 'lucide-react';

export default function EditProduct() {
  const { productId } = useParams<{ productId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [fetchingProduct, setFetchingProduct] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    image_url: '',
    seller_phone: ''
  });

  useEffect(() => {
    if (productId && user) {
      fetchProduct();
    }
  }, [productId, user]);

  const fetchProduct = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;

      if (!data) {
        toast({
          title: "Product not found",
          description: "This product doesn't exist or you don't have permission to edit it.",
          variant: "destructive",
        });
        navigate('/dashboard');
        return;
      }

      setFormData({
        name: data.name || '',
        description: data.description || '',
        price: data.price?.toString() || '',
        category: data.category || '',
        image_url: data.image_url || '',
        seller_phone: data.seller_phone || ''
      });
    } catch (error) {
      console.error('Error fetching product:', error);
      toast({
        title: "Error",
        description: "Failed to load product details.",
        variant: "destructive",
      });
      navigate('/dashboard');
    } finally {
      setFetchingProduct(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !productId) return;

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
        .update({
          name: formData.name,
          description: formData.description,
          price: parseFloat(formData.price),
          category: formData.category || null,
          image_url: formData.image_url || null,
          seller_phone: cleanedPhone,
          updated_at: new Date().toISOString()
        })
        .eq('id', productId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating product:', error);
        toast({
          title: "Error",
          description: "Failed to update product. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Product updated!",
        description: "Your product has been updated successfully.",
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

  const handleImageUploaded = (url: string) => {
    setFormData(prev => ({ ...prev, image_url: url }));
  };

  if (fetchingProduct) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-96 bg-muted rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="flex items-center space-x-4 mb-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard')}
          className="p-2"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Edit Product</h1>
          <p className="text-muted-foreground">
            Update your product listing
          </p>
        </div>
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
            {/* Image Upload */}
            <div className="space-y-2">
              <Label>Product Image</Label>
              <ImageUpload
                onImageUploaded={handleImageUploaded}
                currentImage={formData.image_url}
              />
            </div>

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
                Update Product
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
