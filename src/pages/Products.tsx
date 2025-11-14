import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { WhatsAppButton } from '@/components/ui/whatsapp-button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Heart, Search, Package, Plus, Filter, IndianRupee, School, X, Phone, MoreVertical, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

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
  is_available: boolean;
  sold: boolean;
  approved: boolean;
  profiles?: {
    full_name: string;
    college: string | null;
  };
}

export default function Products() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [wishlistItems, setWishlistItems] = useState<Set<string>>(new Set());
  const [userCollege, setUserCollege] = useState<string | null>(null);
  const [filterByCampus, setFilterByCampus] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const showOnlyMyProducts = searchParams.get('filter') === 'mine';

  useEffect(() => {
    fetchProducts();
    if (user) {
      fetchWishlist();
      fetchUserCollege();
    }

    // Set up real-time subscription for products
    const productsChannel = supabase
      .channel('products-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products'
        },
        (payload) => {
          // Handle real-time updates
          if (payload.eventType === 'UPDATE') {
            const updatedProduct = payload.new as Product;
            setProducts(prev => {
              const index = prev.findIndex(p => p.id === updatedProduct.id);
              if (index === -1) {
                // Product not in current list, might need to add it if it matches filters
                if (showOnlyMyProducts && updatedProduct.user_id === user?.id) {
                  // Fetch full product with profile if needed
                  fetchProducts();
                } else if (!showOnlyMyProducts && updatedProduct.approved && updatedProduct.is_available) {
                  // Fetch full product with profile if needed
                  fetchProducts();
                }
                return prev;
              } else {
                // Update existing product
                const newProducts = [...prev];
                // If product is no longer available and we're NOT showing only my products, remove it
                // (because buyers should only see available products)
                if (!showOnlyMyProducts && !updatedProduct.is_available) {
                  newProducts.splice(index, 1);
                } else {
                  // Update the product, but we need to preserve profile data
                  newProducts[index] = { ...updatedProduct, profiles: prev[index].profiles };
                }
                return newProducts;
              }
            });
          } else if (payload.eventType === 'DELETE') {
            const deletedProduct = payload.old as Product;
            setProducts(prev => prev.filter(p => p.id !== deletedProduct.id));
          } else if (payload.eventType === 'INSERT') {
            const newProduct = payload.new as Product;
            // Only add if it matches current filters
            if (showOnlyMyProducts && newProduct.user_id === user?.id) {
              fetchProducts(); // Refetch to get profile data
            } else if (!showOnlyMyProducts && newProduct.approved && newProduct.is_available) {
              fetchProducts(); // Refetch to get profile data
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(productsChannel);
    };
  }, [user, showOnlyMyProducts]);

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
      let query = supabase
        .from('products')
        .select('*');
      
      // If showing only user's products, filter by user_id and don't require approval
      // Also show all products (available, sold, unavailable) for user's own products
      if (showOnlyMyProducts && user) {
        query = query.eq('user_id', user.id);
      } else {
        // For general browse, only show approved and available products
        query = query.eq('approved', true).eq('is_available', true);
      }
      
      const { data, error } = await query
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
        
        // Extract unique categories
        const categories = [...new Set(
          data
            .map(p => p.category)
            .filter((cat): cat is string => cat !== null && cat !== '')
        )].sort();
        setAvailableCategories(categories);
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

  const handleStatusUpdate = async (productId: string, status: 'available' | 'sold' | 'unavailable') => {
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
        .eq('id', productId);

      if (error) throw error;

      // Real-time update will handle the UI refresh automatically
      // But we still fetch to ensure profile data is included
      fetchProducts();
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

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      // Real-time update will handle the UI refresh automatically
      // Product will be removed from all users' views immediately
      toast({
        title: "Product Deleted",
        description: "Your product has been removed"
      });
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive"
      });
    }
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  const clearAllFilters = () => {
    setSelectedCategories(new Set());
    setFilterByCampus(false);
    setSearchQuery('');
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCampus = !filterByCampus || 
      (userCollege && product.profiles?.college === userCollege);
    
    const matchesCategory = selectedCategories.size === 0 || 
      (product.category && selectedCategories.has(product.category));
    
    const matchesOwnership = !showOnlyMyProducts || product.user_id === user?.id;
    
    return matchesSearch && matchesCampus && matchesCategory && matchesOwnership;
  });

  const activeFiltersCount = (filterByCampus ? 1 : 0) + selectedCategories.size;

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
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {showOnlyMyProducts ? 'Your Products' : 'Browse Products'}
          </h1>
          <p className="text-muted-foreground">
            {showOnlyMyProducts 
              ? 'Manage your product listings' 
              : 'Discover amazing deals from fellow students'
            }
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
        
        {/* Filters Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filters</span>
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {activeFiltersCount}
                </Badge>
              )}
            </div>
            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="h-auto py-1 text-xs"
              >
                Clear All
              </Button>
            )}
          </div>

          {/* Campus Filter */}
          {userCollege && (
            <div className="flex items-center gap-2">
              <Button
                variant={filterByCampus ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterByCampus(!filterByCampus)}
                className="flex items-center gap-2"
              >
                <School className="w-4 h-4" />
                My Campus
              </Button>
            </div>
          )}

          {/* Category Filters */}
          {availableCategories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {availableCategories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategories.has(category) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleCategory(category)}
                  className="flex items-center gap-1.5"
                >
                  {category}
                  {selectedCategories.has(category) && (
                    <X className="w-3 h-3" />
                  )}
                </Button>
              ))}
            </div>
          )}
        </div>
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

                  {product.seller_phone && product.user_id !== user?.id && (
                    <a 
                      href={`tel:${product.seller_phone}`}
                      className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>{product.seller_phone}</span>
                    </a>
                  )}

                  <div className="flex gap-2">
                    {product.user_id === user?.id ? (
                      <>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="outline" size="sm">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              handleStatusUpdate(product.id, 'available');
                            }}>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Mark as Available
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              handleStatusUpdate(product.id, 'sold');
                            }}>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Mark as Sold
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              handleStatusUpdate(product.id, 'unavailable');
                            }}>
                              <XCircle className="w-4 h-4 mr-2" />
                              Mark as Unavailable
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteProduct(product.id);
                              }}
                              className="text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete Product
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <Badge variant={product.sold ? "destructive" : product.is_available ? "default" : "secondary"}>
                          {product.sold ? "Sold" : product.is_available ? "Available" : "Unavailable"}
                        </Badge>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleWishlist(product.id);
                          }}
                          className="flex-1"
                        >
                          <Heart className={`w-4 h-4 ${wishlistItems.has(product.id) ? 'fill-current' : ''}`} />
                        </Button>
                        <WhatsAppButton
                          phone={product.seller_phone}
                          message={`Hi ${product.profiles?.full_name || ''}, I'm interested in your item '${product.name}' on CampusKart. Is it still available?`}
                          productName={product.name}
                          size="sm"
                          className="flex-1"
                        />
                      </>
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