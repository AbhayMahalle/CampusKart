import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  ArrowLeft, 
  Heart, 
  MessageCircle, 
  Phone, 
  User, 
  Calendar,
  DollarSign,
  Package,
  Tag,
  MapPin,
  School
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category: string | null;
  seller_phone: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
  approved: boolean;
  is_available: boolean;
  sold: boolean;
}

interface Profile {
  user_id: string;
  full_name: string;
  college: string | null;
  phone: string | null;
}

export default function ProductDetail() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [seller, setSeller] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [addingToWishlist, setAddingToWishlist] = useState(false);

  useEffect(() => {
    if (productId) {
      fetchProductDetails();
    }
  }, [productId]);

  useEffect(() => {
    if (user && product) {
      checkWishlistStatus();
    }
  }, [user, product]);

  const fetchProductDetails = async () => {
    if (!productId) return;

    try {
      // Fetch product details
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

      if (productError) throw productError;

      if (!productData.approved && productData.user_id !== user?.id) {
        toast({
          title: "Product not found",
          description: "This product is not available",
          variant: "destructive",
        });
        navigate('/products');
        return;
      }

      setProduct(productData);

      // Fetch seller profile
      const { data: sellerData, error: sellerError } = await supabase
        .from('profiles')
        .select('user_id, full_name, college, phone')
        .eq('user_id', productData.user_id)
        .single();

      if (sellerError) {
        console.error('Error fetching seller:', sellerError);
      } else {
        setSeller(sellerData);
      }

    } catch (error) {
      console.error('Error fetching product:', error);
      toast({
        title: "Error loading product",
        description: "Please try again",
        variant: "destructive",
      });
      navigate('/products');
    } finally {
      setLoading(false);
    }
  };

  const checkWishlistStatus = async () => {
    if (!user || !product) return;

    try {
      const { data, error } = await supabase
        .from('wishlist')
        .select('id')
        .eq('user_id', user.id)
        .eq('product_id', product.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking wishlist:', error);
        return;
      }

      setIsInWishlist(!!data);
    } catch (error) {
      console.error('Error in checkWishlistStatus:', error);
    }
  };

  const toggleWishlist = async () => {
    if (!user || !product) {
      toast({
        title: "Authentication required",
        description: "Please sign in to add items to wishlist",
        variant: "destructive",
      });
      return;
    }

    setAddingToWishlist(true);

    try {
      if (isInWishlist) {
        const { error } = await supabase
          .from('wishlist')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', product.id);

        if (error) throw error;

        setIsInWishlist(false);
        toast({
          title: "Removed from wishlist",
          description: "Item removed from your wishlist",
        });
      } else {
        const { error } = await supabase
          .from('wishlist')
          .insert({
            user_id: user.id,
            product_id: product.id
          });

        if (error) throw error;

        setIsInWishlist(true);
        toast({
          title: "Added to wishlist",
          description: "Item added to your wishlist",
        });
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
      toast({
        title: "Error",
        description: "Could not update wishlist",
        variant: "destructive",
      });
    } finally {
      setAddingToWishlist(false);
    }
  };

  const handleWhatsAppContact = () => {
    const phone = product?.seller_phone || seller?.phone;
    if (phone) {
      const message = `Hi, I'm interested in your item '${product?.name}' on CampusKart.`;
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
    }
  };

  const handleInAppChat = () => {
    if (product && seller) {
      window.location.href = `/chat?receiver=${seller.user_id}&product=${product.id}`;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-32 mb-6"></div>
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="h-96 bg-muted rounded-lg"></div>
            <div className="space-y-4">
              <div className="h-8 bg-muted rounded w-3/4"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
              <div className="h-20 bg-muted rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Product not found</h2>
          <p className="text-muted-foreground mb-4">
            The product you're looking for doesn't exist or is no longer available.
          </p>
          <Button onClick={() => navigate('/products')}>
            Back to Products
          </Button>
        </div>
      </div>
    );
  }

  const isOwnProduct = product.user_id === user?.id;
  const hasWhatsApp = Boolean(product.seller_phone || seller?.phone);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => navigate('/products')}
        className="mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Products
      </Button>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Product Image */}
        <div className="space-y-4">
          <Card className="overflow-hidden">
            <div className="aspect-square bg-muted flex items-center justify-center">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Package className="w-24 h-24 text-muted-foreground" />
              )}
            </div>
          </Card>

          {/* Status Badges */}
          <div className="flex gap-2">
            {product.sold && (
              <Badge variant="destructive">Sold</Badge>
            )}
            {!product.is_available && (
              <Badge variant="secondary">Unavailable</Badge>
            )}
            {!product.approved && isOwnProduct && (
              <Badge variant="outline">Pending Approval</Badge>
            )}
          </div>
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
            {product.category && (
              <Badge variant="secondary" className="mb-4">
                <Tag className="w-3 h-3 mr-1" />
                {product.category}
              </Badge>
            )}
            <div className="flex items-center text-3xl font-bold text-primary mb-4">
              <DollarSign className="w-8 h-8" />
              {product.price.toLocaleString()}
            </div>
          </div>

          {product.description && (
            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {product.description}
              </p>
            </div>
          )}

          <Separator />

          {/* Seller Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="w-5 h-5" />
                <span>Seller Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">{seller?.full_name || 'Anonymous'}</span>
              </div>
              {seller?.college && (
                <div className="flex items-center space-x-2">
                  <School className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{seller.college}</span>
                </div>
              )}
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Listed {new Date(product.created_at).toLocaleDateString()}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          {!isOwnProduct && product.is_available && !product.sold && (
            <div className="space-y-3">
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={toggleWishlist}
                  disabled={addingToWishlist}
                  className="flex-1"
                >
                  <Heart className={`w-4 h-4 mr-2 ${isInWishlist ? 'fill-current' : ''}`} />
                  {isInWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
                </Button>
              </div>
              
              <div className="flex gap-3">
                {hasWhatsApp ? (
                  <Button
                    onClick={handleWhatsAppContact}
                    className="flex-1"
                    size="lg"
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Contact on WhatsApp
                  </Button>
                ) : (
                  <Button
                    onClick={handleInAppChat}
                    className="flex-1"
                    size="lg"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Chat with Seller
                  </Button>
                )}
              </div>

              {hasWhatsApp && (
                <Button
                  variant="outline"
                  onClick={handleInAppChat}
                  className="w-full"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Or chat in app
                </Button>
              )}
            </div>
          )}

          {isOwnProduct && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-center text-muted-foreground">
                This is your product listing
              </p>
            </div>
          )}

          {(product.sold || !product.is_available) && !isOwnProduct && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-center text-muted-foreground">
                This product is no longer available
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}