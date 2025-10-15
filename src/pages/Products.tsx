import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Heart, MessageCircle, Search, Package, Plus, Filter, IndianRupee, School } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string | null;
  category: string | null;
  seller_phone: string | null;
  created_at: string;
  user_id: string;
  profiles?: {
    full_name: string;
    college: string | null;
  };
}

export default function Products() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [wishlistItems, setWishlistItems] = useState<Set<string>>(new Set());
  const [userCollege, setUserCollege] = useState<string | null>(null);
  const [filterByCampus, setFilterByCampus] = useState(false);

  useEffect(() => {
    fetchProducts();
    if (user) {
      fetchWishlist();
      fetchUserCollege();
    }
  }, [user]);

  const fetchUserCollege = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('college')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching user college:', error);
        return;
      }

      setUserCollege(data?.college || null);
    } catch (error) {
      console.error('Error in fetchUserCollege:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('approved', true)
        .eq('is_available', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching products:', error);
        toast({
          title: "Error loading products",
          description: "Could not load products.",
          variant: "destructive",
        });
        return;
      }

      // Fetch seller profiles for each product
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map(p => p.user_id))];
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, full_name, college')
          .in('user_id', userIds);

        const profilesMap = new Map(
          profilesData?.map(p => [p.user_id, p]) || []
        );

        const productsWithProfiles = data.map(product => ({
          ...product,
          profiles: profilesMap.get(product.user_id)
        }));

        setProducts(productsWithProfiles);
      } else {
        setProducts([]);
      }
    } catch (error) {
      console.error('Error in fetchProducts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWishlist = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('wishlist')
        .select('product_id')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching wishlist:', error);
        return;
      }

      setWishlistItems(new Set(data?.map(item => item.product_id) || []));
    } catch (error) {
      console.error('Error in fetchWishlist:', error);
    }
  };

  const toggleWishlist = async (productId: string) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to add items to wishlist.",
        variant: "destructive",
      });
      return;
    }

    try {
      const isInWishlist = wishlistItems.has(productId);

      if (isInWishlist) {
        const { error } = await supabase
          .from('wishlist')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', productId);

        if (error) {
          console.error('Error removing from wishlist:', error);
          toast({
            title: "Error",
            description: "Could not remove item from wishlist.",
            variant: "destructive",
          });
          return;
        }

        setWishlistItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(productId);
          return newSet;
        });

        toast({
          title: "Removed from wishlist",
          description: "Item removed from your wishlist.",
        });
      } else {
        const { error } = await supabase
          .from('wishlist')
          .insert({
            user_id: user.id,
            product_id: productId
          });

        if (error) {
          console.error('Error adding to wishlist:', error);
          toast({
            title: "Error",
            description: "Could not add item to wishlist.",
            variant: "destructive",
          });
          return;
        }

        setWishlistItems(prev => new Set([...prev, productId]));

        toast({
          title: "Added to wishlist",
          description: "Item added to your wishlist.",
        });
      }
    } catch (error) {
      console.error('Error in toggleWishlist:', error);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCampus = !filterByCampus || 
      (userCollege && product.profiles?.college === userCollege);
    
    return matchesSearch && matchesCampus;
  });

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-80 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Browse Products</h1>
          <p className="text-muted-foreground">
            Discover amazing deals from fellow students
          </p>
        </div>
        <Button asChild size="lg" className="mt-4 sm:mt-0">
          <Link to="/add-product">
            <Plus className="w-4 h-4" />
            List Product
          </Link>
        </Button>
      </div>

      {/* Search and Filter Bar */}
      <div className="space-y-4 mb-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search products, categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 py-6 text-base"
          />
        </div>
        
        {userCollege && (
          <div className="flex items-center gap-2">
            <Button
              variant={filterByCampus ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterByCampus(!filterByCampus)}
              className="flex items-center gap-2"
            >
              <School className="w-4 h-4" />
              {filterByCampus ? `Showing: ${userCollege}` : 'Filter by My Campus'}
            </Button>
            {filterByCampus && (
              <Badge variant="secondary" className="text-xs">
                {filteredProducts.length} items
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">
            {searchQuery ? 'No products found' : 'No products available'}
          </h3>
          <p className="text-muted-foreground mb-6">
            {searchQuery 
              ? 'Try adjusting your search terms.' 
              : 'Be the first to list a product!'
            }
          </p>
          <Button asChild>
            <Link to="/add-product">
              <Plus className="w-4 h-4" />
              Add First Product
            </Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-4">
            <p className="text-muted-foreground">
              {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} found
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <Card 
                key={product.id} 
                className="group hover:shadow-card-hover transition-all duration-300 overflow-hidden cursor-pointer"
                onClick={() => navigate(`/products/${product.id}`)}
              >
                <CardHeader className="pb-2">
                  <div className="aspect-square bg-muted rounded-lg mb-3 overflow-hidden relative">
                    {product.image_url ? (
                      <img 
                        src={product.image_url} 
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-12 h-12 text-muted-foreground" />
                      </div>
                    )}
                    <Button
                      size="icon"
                      variant={wishlistItems.has(product.id) ? "default" : "outline"}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.preventDefault();
                        toggleWishlist(product.id);
                      }}
                    >
                      <Heart className={`w-4 h-4 ${wishlistItems.has(product.id) ? 'fill-current' : ''}`} />
                    </Button>
                  </div>
                  <CardTitle className="line-clamp-1 text-base">{product.name}</CardTitle>
                  <CardDescription className="line-clamp-2 text-sm">
                    {product.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center text-2xl font-bold text-primary">
                      <IndianRupee className="w-5 h-5" />
                      {product.price.toLocaleString()}
                    </div>
                    {product.category && (
                      <span className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded-md">
                        {product.category}
                      </span>
                    )}
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    {product.profiles?.college && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <School className="w-3 h-3" />
                        <span className="truncate">{product.profiles.college}</span>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Listed {new Date(product.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleWishlist(product.id)}
                      className="flex-1"
                    >
                      <Heart className={`w-4 h-4 ${wishlistItems.has(product.id) ? 'fill-current' : ''}`} />
                    </Button>
                    {product.user_id === user?.id ? (
                      <Button
                        size="sm"
                        className="flex-1"
                        disabled
                      >
                        Your Item
                      </Button>
                    ) : product.seller_phone ? (
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          const message = `Hi, I'm interested in your item '${product.name}' on CampusKart.`;
                          window.open(`https://wa.me/${product.seller_phone}?text=${encodeURIComponent(message)}`, '_blank');
                        }}
                      >
                        <MessageCircle className="w-4 h-4 mr-1" />
                        WhatsApp
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          window.location.href = `/chat?receiver=${product.user_id}&product=${product.id}`;
                        }}
                      >
                        <MessageCircle className="w-4 h-4 mr-1" />
                        Chat
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}