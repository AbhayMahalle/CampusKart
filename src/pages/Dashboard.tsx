import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, ShoppingBag, Heart, Building2, MessageCircle, TrendingUp, Package, Users, IndianRupee, ArrowRight } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  created_at: string;
}

interface DashboardStats {
  totalProducts: number;
  totalWishlist: number;
  totalFlats: number;
  totalMessages: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [userProducts, setUserProducts] = useState<Product[]>([]);
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalWishlist: 0,
    totalFlats: 0,
    totalMessages: 0
  });
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    if (user) {
      Promise.all([
        fetchUserProducts(),
        fetchRecommendedProducts(),
        fetchDashboardStats(),
        fetchUserProfile()
      ]).finally(() => setLoading(false));
    }
  }, [user]);

  const fetchUserProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
        return;
      }

      setUserProfile(data);
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
    }
  };

  const fetchUserProducts = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, price, image_url, created_at')
        .eq('user_id', user.id)
        .eq('is_available', true)
        .order('created_at', { ascending: false })
        .limit(6);

      if (error) {
        console.error('Error fetching products:', error);
        toast({
          title: "Error loading products",
          description: "Could not load your products.",
          variant: "destructive",
        });
        return;
      }

      setUserProducts(data || []);
    } catch (error) {
      console.error('Error in fetchUserProducts:', error);
    }
  };

  const fetchRecommendedProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, price, image_url, created_at')
        .eq('approved', true)
        .eq('is_available', true)
        .neq('user_id', user?.id || '')
        .order('created_at', { ascending: false })
        .limit(6);

      if (error) {
        console.error('Error fetching recommended products:', error);
        return;
      }

      setRecommendedProducts(data || []);
    } catch (error) {
      console.error('Error in fetchRecommendedProducts:', error);
    }
  };

  const fetchDashboardStats = async () => {
    if (!user) return;

    try {
      const [productsRes, wishlistRes, flatsRes, messagesRes] = await Promise.all([
        supabase.from('products').select('id', { count: 'exact' }).eq('user_id', user.id),
        supabase.from('wishlist').select('id', { count: 'exact' }).eq('user_id', user.id),
        supabase.from('flat_listings').select('id', { count: 'exact' }).eq('user_id', user.id),
        supabase.from('messages').select('id', { count: 'exact' }).or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      ]);

      setStats({
        totalProducts: productsRes.count || 0,
        totalWishlist: wishlistRes.count || 0,
        totalFlats: flatsRes.count || 0,
        totalMessages: messagesRes.count || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Welcome back, {userProfile?.full_name || user?.email?.split('@')[0]}! 👋
        </h1>
        <p className="text-muted-foreground">
          Here's what's happening with your CampusKart account.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <Card className="bg-gradient-card hover:shadow-card-hover transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your Products</CardTitle>
            <Package className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.totalProducts}</div>
            <p className="text-xs text-muted-foreground">Items listed for sale</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card hover:shadow-card-hover transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Wishlist</CardTitle>
            <Heart className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">{stats.totalWishlist}</div>
            <p className="text-xs text-muted-foreground">Items you want</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card hover:shadow-card-hover transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Flat Listings</CardTitle>
            <Building2 className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-secondary">{stats.totalFlats}</div>
            <p className="text-xs text-muted-foreground">Accommodation posts</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card hover:shadow-card-hover transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages</CardTitle>
            <MessageCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{stats.totalMessages}</div>
            <p className="text-xs text-muted-foreground">Total conversations</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Button asChild variant="hero" size="lg" className="h-16">
          <Link to="/add-product" className="flex flex-col items-center space-y-1">
            <Plus className="w-6 h-6" />
            <span>Add Product</span>
          </Link>
        </Button>
        
        <Button asChild variant="accent" size="lg" className="h-16">
          <Link to="/products" className="flex flex-col items-center space-y-1">
            <ShoppingBag className="w-6 h-6" />
            <span>Browse Products</span>
          </Link>
        </Button>
        
        <Button asChild variant="secondary" size="lg" className="h-16">
          <Link to="/flats" className="flex flex-col items-center space-y-1">
            <Building2 className="w-6 h-6" />
            <span>Find Flats</span>
          </Link>
        </Button>
        
        <Button asChild variant="outline" size="lg" className="h-16">
          <Link to="/chat" className="flex flex-col items-center space-y-1">
            <MessageCircle className="w-6 h-6" />
            <span>Chat</span>
          </Link>
        </Button>
      </div>

      {/* Recent Products */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                <span>Your Recent Products</span>
              </CardTitle>
              <CardDescription>Items you've recently listed for sale</CardDescription>
            </div>
            <Button asChild variant="outline">
              <Link to="/products?filter=mine">View All</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {userProducts.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">You haven't listed any products yet.</p>
              <Button asChild variant="hero">
                <Link to="/add-product">List Your First Product</Link>
              </Button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {userProducts.map((product) => (
                <Card key={product.id} className="hover:shadow-card-hover transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="aspect-square bg-muted rounded-lg mb-2 overflow-hidden">
                      {product.image_url ? (
                        <img 
                          src={product.image_url} 
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <CardTitle className="text-sm line-clamp-1">{product.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center text-lg font-semibold text-primary">
                      <IndianRupee className="w-4 h-4" />
                      {product.price.toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Listed {new Date(product.created_at).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recommended Products */}
      {recommendedProducts.length > 0 && (
        <Card className="mt-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <ShoppingBag className="w-5 h-5 text-accent" />
                  <span>Recommended for You</span>
                </CardTitle>
                <CardDescription>Products you might be interested in</CardDescription>
              </div>
              <Button asChild variant="outline">
                <Link to="/products">
                  View All
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <div className="flex space-x-4 pb-4">
                {recommendedProducts.map((product) => (
                  <Link 
                    key={product.id} 
                    to={`/products/${product.id}`}
                    className="flex-shrink-0 w-48"
                  >
                    <Card className="hover:shadow-card-hover transition-shadow h-full">
                      <div className="aspect-square bg-muted rounded-t-lg overflow-hidden">
                        {product.image_url ? (
                          <img 
                            src={product.image_url} 
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-8 h-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <CardContent className="p-3">
                        <CardTitle className="text-sm line-clamp-2 mb-2 h-10">{product.name}</CardTitle>
                        <div className="flex items-center text-base font-semibold text-primary">
                          <IndianRupee className="w-4 h-4" />
                          {product.price.toLocaleString()}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}