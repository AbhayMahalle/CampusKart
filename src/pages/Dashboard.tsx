import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ProductCard } from '@/components/ProductCard';
import { PromoBanner, DealsBanner } from '@/components/PromoBanner';
import {
  Plus,
  ShoppingBag,
  Heart,
  Building2,
  TrendingUp,
  Package,
  IndianRupee,
  ArrowRight,
  MoreVertical,
  Trash2,
  CheckCircle,
  XCircle,
  Pencil,
  Sparkles,
  Eye
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface Product {
  id: string;
  name: string;
  title?: string;
  price: number;
  image_url: string | null;
  created_at: string;
  is_available: boolean;
  sold: boolean;
  category?: string | null;
}

interface DashboardStats {
  totalProducts: number;
  totalWishlist: number;
  totalFlats: number;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [userProducts, setUserProducts] = useState<Product[]>([]);
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalWishlist: 0,
    totalFlats: 0
  });

  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    if (user) {
      Promise.all([
        fetchUserProducts(),
        fetchMLorFallback(),
        fetchDashboardStats(),
        fetchUserProfile()
      ]).finally(() => setLoading(false));
    }
  }, [user]);

  const fetchMLorFallback = async () => {
    const last = localStorage.getItem("lastSearch");

    if (last) {
      try {
        const res = await fetch("http://localhost:5001/recommend", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: last })
        });

        const mlData = await res.json();

        if (Array.isArray(mlData) && mlData.length > 0) {
          setRecommendedProducts(mlData);
          return;
        }
      } catch (err) {
        console.error("ML API error:", err);
      }
    }

    const { data, error } = await supabase
      .from("products")
      .select("id, name, price, image_url, created_at, is_available, sold, category")
      .eq("approved", true)
      .eq("is_available", true)
      .eq("sold", false)
      .limit(8);

    if (!error && data) setRecommendedProducts(data);
  };

  const fetchUserProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") return;

      setUserProfile(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUserProducts = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, title, price, image_url, created_at, is_available, sold, category")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(6);

      if (error) return;

      setUserProducts(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDashboardStats = async () => {
    if (!user) return;

    try {
      const [productsRes, wishlistRes, flatsRes] = await Promise.all([
        supabase.from("products").select("id", { count: "exact" }).eq("user_id", user.id),
        supabase.from("wishlist").select("id", { count: "exact" }).eq("user_id", user.id),
        supabase.from("flat_listings").select("id", { count: "exact" }).eq("user_id", user.id)
      ]);

      setStats({
        totalProducts: productsRes.count || 0,
        totalWishlist: wishlistRes.count || 0,
        totalFlats: flatsRes.count || 0
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleStatusUpdate = async (productId: string, status: 'available' | 'sold' | 'unavailable') => {
    try {
      const updates: any = {};

      if (status === "available") {
        updates.is_available = true;
        updates.sold = false;
      } else if (status === "sold") {
        updates.sold = true;
        updates.is_available = false;
      } else {
        updates.is_available = false;
        updates.sold = false;
      }

      const { error } = await supabase
        .from("products")
        .update(updates)
        .eq("id", productId);

      if (error) throw error;

      fetchUserProducts();
      fetchDashboardStats();

      toast({ title: "Status Updated", description: `Product marked as ${status}` });
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Failed to update product status", variant: "destructive" });
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      const { error } = await supabase.from("products").delete().eq("id", productId);

      if (error) throw error;

      fetchUserProducts();
      fetchDashboardStats();
      toast({ title: "Product Deleted", description: "Your product has been removed" });
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Failed to delete product", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-32 bg-muted rounded-2xl"></div>
            <div className="grid md:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-muted rounded-xl"></div>
              ))}
            </div>
            <div className="h-64 bg-muted rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        {/* Welcome Banner */}
        <div className="bg-gradient-hero rounded-2xl p-6 md:p-8 mb-6 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/20 rounded-full translate-y-1/2 -translate-x-1/2" />
          </div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="text-white">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5" />
                <span className="text-sm font-medium text-white/80">Welcome back!</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold mb-1">
                {userProfile?.full_name || user?.email?.split("@")[0]}
              </h1>
              <p className="text-white/80">
                Here's what's happening with your CampusKart account today.
              </p>
            </div>
            
            <Button 
              asChild
              size="lg" 
              className="bg-white text-foreground hover:bg-white/90 shadow-lg"
            >
              <Link to="/add-product">
                <Plus className="w-4 h-4 mr-2" />
                Add New Product
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <Link to="/products?filter=mine">
            <Card className="group hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border-primary/20 hover:border-primary/40">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Your Products</p>
                    <p className="text-3xl font-bold text-foreground">{stats.totalProducts}</p>
                    <p className="text-xs text-muted-foreground mt-1">Items listed</p>
                  </div>
                  <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Package className="w-7 h-7 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to="/wishlist">
            <Card className="group hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border-accent/20 hover:border-accent/40">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Wishlist</p>
                    <p className="text-3xl font-bold text-foreground">{stats.totalWishlist}</p>
                    <p className="text-xs text-muted-foreground mt-1">Saved items</p>
                  </div>
                  <div className="w-14 h-14 bg-accent/10 rounded-xl flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                    <Heart className="w-7 h-7 text-accent" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to="/flats?filter=mine">
            <Card className="group hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border-secondary/20 hover:border-secondary/40">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Flat Listings</p>
                    <p className="text-3xl font-bold text-foreground">{stats.totalFlats}</p>
                    <p className="text-xs text-muted-foreground mt-1">Accommodations</p>
                  </div>
                  <div className="w-14 h-14 bg-secondary/10 rounded-xl flex items-center justify-center group-hover:bg-secondary/20 transition-colors">
                    <Building2 className="w-7 h-7 text-secondary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2 hover:bg-primary/5 hover:border-primary/30">
            <Link to="/add-product">
              <Plus className="w-5 h-5 text-primary" />
              <span className="text-sm">Add Product</span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2 hover:bg-accent/5 hover:border-accent/30">
            <Link to="/products">
              <ShoppingBag className="w-5 h-5 text-accent" />
              <span className="text-sm">Browse</span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2 hover:bg-secondary/5 hover:border-secondary/30">
            <Link to="/flats">
              <Building2 className="w-5 h-5 text-secondary" />
              <span className="text-sm">Find Flats</span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2 hover:bg-success/5 hover:border-success/30">
            <Link to="/add-flat">
              <Plus className="w-5 h-5 text-success" />
              <span className="text-sm">Add Flat</span>
            </Link>
          </Button>
        </div>

        {/* Deals Banner */}
        <div className="mb-6">
          <DealsBanner />
        </div>

        {/* Your Products Section */}
        <Card className="mb-6">
          <CardHeader className="border-b bg-muted/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Your Recent Products</CardTitle>
                  <CardDescription>Items you've listed for sale</CardDescription>
                </div>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link to="/products?filter=mine">
                  View All
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            {userProducts.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground mb-4">You haven't listed any products yet.</p>
                <Button asChild className="bg-gradient-primary">
                  <Link to="/add-product">
                    <Plus className="w-4 h-4 mr-1" />
                    List Your First Product
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {userProducts.map((product) => (
                  <Card key={product.id} className="group hover:shadow-lg transition-all duration-300 overflow-hidden">
                    <div className="aspect-square bg-muted relative overflow-hidden">
                      {product.image_url ? (
                        <img 
                          src={product.image_url} 
                          alt={product.title || product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-12 h-12 text-muted-foreground/50" />
                        </div>
                      )}
                      
                      {/* Status Badge */}
                      <Badge
                        variant={product.sold ? "destructive" : product.is_available ? "default" : "secondary"}
                        className="absolute top-2 left-2"
                      >
                        {product.sold ? "Sold" : product.is_available ? "Available" : "Unavailable"}
                      </Badge>

                      {/* Quick Actions Overlay */}
                      <div className="absolute inset-0 bg-foreground/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button 
                          size="sm" 
                          variant="secondary"
                          onClick={() => navigate(`/products/${product.id}`)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        <Button 
                          size="sm" 
                          variant="secondary"
                          onClick={() => navigate(`/edit-product/${product.id}`)}
                        >
                          <Pencil className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                      </div>
                    </div>

                    <CardContent className="p-4">
                      <h3 className="font-medium text-sm line-clamp-1 mb-2">
                        {product.title || product.name}
                      </h3>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-lg font-bold text-primary">
                          <IndianRupee className="w-4 h-4" />
                          {product.price.toLocaleString()}
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-card">
                            <DropdownMenuItem onClick={() => navigate(`/edit-product/${product.id}`)}>
                              <Pencil className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusUpdate(product.id, "available")}>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Mark Available
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusUpdate(product.id, "sold")}>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Mark Sold
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusUpdate(product.id, "unavailable")}>
                              <XCircle className="w-4 h-4 mr-2" />
                              Mark Unavailable
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteProduct(product.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recommended Products */}
        <Card>
          <CardHeader className="border-b bg-muted/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <CardTitle className="text-lg">Recommended for You</CardTitle>
                  <CardDescription>Products you might be interested in</CardDescription>
                </div>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link to="/products">
                  View All
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            <ScrollArea className="w-full whitespace-nowrap">
              <div className="flex gap-4 pb-4">
                {recommendedProducts.map((product) => (
                  <Link 
                    key={product.id} 
                    to={`/products/${product.id}`} 
                    className="flex-shrink-0 w-48 group"
                  >
                    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300">
                      <div className="aspect-square bg-muted overflow-hidden">
                        {product.image_url ? (
                          <img 
                            src={product.image_url} 
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-8 h-8 text-muted-foreground/50" />
                          </div>
                        )}
                      </div>
                      <CardContent className="p-3">
                        <h3 className="text-sm font-medium line-clamp-2 mb-2 h-10 group-hover:text-primary transition-colors">
                          {product.name}
                        </h3>
                        <div className="flex items-center text-base font-bold text-primary">
                          <IndianRupee className="w-4 h-4" />
                          {product.price.toLocaleString()}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
