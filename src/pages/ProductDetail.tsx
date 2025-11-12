import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { WhatsAppButton } from '@/components/ui/whatsapp-button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
  ArrowLeft,
  Heart,
  User,
  Calendar,
  IndianRupee,
  Package,
  Tag,
  School,
  Phone,
  MoreVertical,
  Trash2,
  CheckCircle,
  XCircle
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

  const handleStatusUpdate = async (status: 'available' | 'sold' | 'unavailable') => {
    try {
      const updates: any = {};
      
      if (status === 'available') {
        updates.is_available = true;
        updates.sold = false;
      } else if (status === 'sold') {
        updates.sold = true;
        updates.is_available = false;
      } else if (status === 'unavailable') {
        updates.is_available = false;
        updates.sold = false;
      }

      const { error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', productId!);

      if (error) throw error;

      fetchProductDetails();
      toast({
        title: "Status Updated",
        description: `Product marked as ${status}`
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "Failed to update product status",
        variant: "destructive"
      });
    }
  };

  const handleDeleteProduct = async () => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId!);

      if (error) throw error;

      toast({
        title: "Product Deleted",
        description: "Your product has been removed"
      });
      
      navigate('/products');
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive"
      });
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
              <IndianRupee className="w-8 h-8" />
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
              {product.seller_phone && (
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <a 
                    href={`tel:${product.seller_phone}`}
                    className="text-sm text-primary hover:underline"
                  >
                    {product.seller_phone}
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-2">
            {isOwnProduct ? (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="flex-1">
                      <MoreVertical className="w-4 h-4 mr-2" />
                      Manage Product
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleStatusUpdate('available')}>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Mark as Available
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleStatusUpdate('sold')}>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Mark as Sold
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleStatusUpdate('unavailable')}>
                      <XCircle className="w-4 h-4 mr-2" />
                      Mark as Unavailable
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={handleDeleteProduct}
                      className="text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Product
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Badge variant={product.sold ? "destructive" : product.is_available ? "default" : "secondary"} className="h-10 px-4 flex items-center">
                  {product.sold ? "Sold" : product.is_available ? "Available" : "Unavailable"}
                </Badge>
              </>
            ) : (
              <>
                {product.is_available && !product.sold && (
                  <>
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={toggleWishlist}
                      disabled={addingToWishlist}
                    >
                      <Heart
                        className={`w-4 h-4 mr-2 ${isInWishlist ? 'fill-red-500 text-red-500' : ''}`}
                      />
                      {isInWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
                    </Button>
                    <WhatsAppButton
                      phone={product.seller_phone || ''}
                      message={`Hi, I'm interested in your item '${product.name}' on CampusKart. Is it still available?`}
                      productName={product.name}
                      variant="default"
                      size="lg"
                      className="flex-1"
                    />
                  </>
                )}
                {(product.sold || !product.is_available) && (
                  <div className="w-full p-4 bg-muted rounded-lg">
                    <p className="text-center text-muted-foreground">
                      This product is no longer available
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}