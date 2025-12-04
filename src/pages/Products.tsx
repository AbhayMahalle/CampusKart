import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ProductCard } from '@/components/ProductCard';
import { CategoryBar } from '@/components/CategoryBar';
import { PromoBanner, TrendingBanner } from '@/components/PromoBanner';
import { 
  Search, 
  Package, 
  Plus, 
  Filter, 
  School, 
  X, 
  SlidersHorizontal,
  Grid3X3,
  LayoutGrid,
  ArrowUpDown
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

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
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [wishlistItems, setWishlistItems] = useState<Set<string>>(new Set());
  const [userCollege, setUserCollege] = useState<string | null>(null);
  const [filterByCampus, setFilterByCampus] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>('newest');
  const [gridCols, setGridCols] = useState<'compact' | 'normal'>('normal');
  const showOnlyMyProducts = searchParams.get('filter') === 'mine';

  useEffect(() => {
    fetchProducts();
    if (user) {
      fetchWishlist();
      fetchUserCollege();
    }

    const productsChannel = supabase
      .channel('products-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products'
        },
        () => {
          fetchProducts();
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
      const { data } = await supabase
        .from('profiles')
        .select('college')
        .eq('user_id', user.id)
        .single();
      setUserCollege(data?.college || null);
    } catch (error) {
      console.error('Error fetching user college:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      let query = supabase
        .from('products')
        .select('*');

      if (showOnlyMyProducts && user) {
        query = query.eq('user_id', user.id);
      } else {
        query = query
          .eq('approved', true)
          .eq('is_available', true)
          .eq('sold', false);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        toast({
          title: "Error loading products",
          description: "Could not load products.",
          variant: "destructive",
        });
        return;
      }

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
      const { data } = await supabase
        .from('wishlist')
        .select('product_id')
        .eq('user_id', user.id);
      setWishlistItems(new Set(data?.map(item => item.product_id) || []));
    } catch (error) {
      console.error('Error in fetchWishlist:', error);
    }
  };

  const toggleWishlist = async (productId: string) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to add items to wishlist.",
        variant: "destructive",
      });
      return;
    }

    const isInWishlist = wishlistItems.has(productId);

    try {
      if (isInWishlist) {
        await supabase
          .from('wishlist')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', productId);

        setWishlistItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(productId);
          return newSet;
        });
        toast({ title: "Removed from wishlist" });
      } else {
        await supabase
          .from('wishlist')
          .insert({ user_id: user.id, product_id: productId });

        setWishlistItems(prev => new Set([...prev, productId]));
        toast({ title: "Added to wishlist" });
      }
    } catch (error) {
      console.error('Error in toggleWishlist:', error);
    }
  };

  const handleCategorySelect = (category: string | null) => {
    setSelectedCategory(category);
  };

  const filteredProducts = products
    .filter(product => {
      const matchesSearch = 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCampus = !filterByCampus ||
        (userCollege && product.profiles?.college === userCollege);

      const matchesCategory = !selectedCategory ||
        product.category === selectedCategory;

      return matchesSearch && matchesCampus && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        default: // newest
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

  const activeFiltersCount = (filterByCampus ? 1 : 0) + (selectedCategory ? 1 : 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-12 bg-muted rounded-lg w-full"></div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="aspect-[3/4] bg-muted rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Category Bar */}
      <CategoryBar 
        selectedCategory={selectedCategory || undefined}
        onCategorySelect={handleCategorySelect}
      />

      <div className="container mx-auto px-4 py-6">
        {/* Page Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              {showOnlyMyProducts ? 'Your Products' : 'Browse Products'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {showOnlyMyProducts
                ? 'Manage your product listings'
                : `Discover ${filteredProducts.length} amazing deals from fellow students`
              }
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button asChild className="bg-gradient-primary hover:opacity-90">
              <Link to="/add-product">
                <Plus className="w-4 h-4 mr-1" />
                List Product
              </Link>
            </Button>
          </div>
        </div>

        {/* Promo Banner */}
        {!showOnlyMyProducts && (
          <div className="mb-6">
            <PromoBanner variant="gradient" />
          </div>
        )}

        {/* Filters & Search Bar */}
        <div className="bg-card border border-border rounded-xl p-4 mb-6 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 bg-muted/50"
              />
            </div>

            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-48 h-11">
                <ArrowUpDown className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
              </SelectContent>
            </Select>

            {/* Mobile Filter Sheet */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="md:hidden h-11">
                  <SlidersHorizontal className="w-4 h-4 mr-2" />
                  Filters
                  {activeFiltersCount > 0 && (
                    <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-4">
                  {userCollege && (
                    <Button
                      variant={filterByCampus ? "default" : "outline"}
                      onClick={() => setFilterByCampus(!filterByCampus)}
                      className="w-full justify-start"
                    >
                      <School className="w-4 h-4 mr-2" />
                      My Campus Only
                    </Button>
                  )}
                </div>
              </SheetContent>
            </Sheet>

            {/* Desktop Filters */}
            <div className="hidden md:flex items-center gap-2">
              {userCollege && (
                <Button
                  variant={filterByCampus ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterByCampus(!filterByCampus)}
                  className="h-11"
                >
                  <School className="w-4 h-4 mr-2" />
                  My Campus
                </Button>
              )}

              {/* Grid Toggle */}
              <div className="flex border rounded-lg overflow-hidden">
                <Button
                  variant={gridCols === 'normal' ? 'default' : 'ghost'}
                  size="icon"
                  className="h-11 w-11 rounded-none"
                  onClick={() => setGridCols('normal')}
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={gridCols === 'compact' ? 'default' : 'ghost'}
                  size="icon"
                  className="h-11 w-11 rounded-none"
                  onClick={() => setGridCols('compact')}
                >
                  <LayoutGrid className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Active Filters */}
          {(activeFiltersCount > 0 || searchQuery) && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground">Active filters:</span>
              {searchQuery && (
                <Badge variant="secondary" className="gap-1">
                  Search: {searchQuery}
                  <X 
                    className="w-3 h-3 cursor-pointer" 
                    onClick={() => setSearchQuery('')}
                  />
                </Badge>
              )}
              {filterByCampus && (
                <Badge variant="secondary" className="gap-1">
                  My Campus
                  <X 
                    className="w-3 h-3 cursor-pointer" 
                    onClick={() => setFilterByCampus(false)}
                  />
                </Badge>
              )}
              {selectedCategory && (
                <Badge variant="secondary" className="gap-1">
                  {selectedCategory}
                  <X 
                    className="w-3 h-3 cursor-pointer" 
                    onClick={() => setSelectedCategory(null)}
                  />
                </Badge>
              )}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  setSearchQuery('');
                  setFilterByCampus(false);
                  setSelectedCategory(null);
                }}
                className="text-destructive hover:text-destructive"
              >
                Clear All
              </Button>
            </div>
          )}
        </div>

        {/* Trending Badge */}
        {!showOnlyMyProducts && filteredProducts.length > 0 && (
          <div className="mb-4">
            <TrendingBanner />
          </div>
        )}

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
              <Package className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-foreground">
              {searchQuery ? 'No products found' : 'No products available'}
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              {searchQuery
                ? 'Try adjusting your search terms or filters.'
                : 'Be the first to list a product and start selling!'
              }
            </p>
            <Button asChild className="bg-gradient-primary">
              <Link to="/add-product">
                <Plus className="w-4 h-4 mr-1" />
                Add First Product
              </Link>
            </Button>
          </div>
        ) : (
          <div className={`grid gap-4 ${
            gridCols === 'compact' 
              ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6' 
              : 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
          }`}>
            {filteredProducts.map((product, index) => (
              <div 
                key={product.id} 
                className="animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <ProductCard
                  id={product.id}
                  name={product.name}
                  price={product.price}
                  imageUrl={product.image_url}
                  category={product.category}
                  isAvailable={product.is_available}
                  sold={product.sold}
                  sellerName={product.profiles?.full_name}
                  college={product.profiles?.college || undefined}
                  isInWishlist={wishlistItems.has(product.id)}
                  onWishlistToggle={toggleWishlist}
                  showWishlist={product.user_id !== user?.id}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
