import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Users, 
  Package, 
  Home, 
  MessageCircle, 
  Check, 
  X, 
  Eye,
  TrendingUp,
  IndianRupee 
} from 'lucide-react';

interface DashboardStats {
  totalUsers: number;
  totalProducts: number;
  pendingProducts: number;
  totalFlats: number;
  totalChats: number;
}

interface Product {
  id: string;
  name: string;
  price: number;
  category: string | null;
  approved: boolean;
  created_at: string;
  user_id: string;
  profiles?: {
    full_name: string;
  };
}

export default function AdminDashboard() {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalProducts: 0,
    pendingProducts: 0,
    totalFlats: 0,
    totalChats: 0
  });
  const [pendingProducts, setPendingProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAdmin) {
      fetchDashboardData();
    }
  }, [isAdmin]);

  const fetchDashboardData = async () => {
    try {
      // Fetch all stats in parallel
      const [usersResult, productsResult, flatsResult, chatsResult, pendingResult] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact' }),
        supabase.from('products').select('id, approved', { count: 'exact' }),
        supabase.from('flat_listings').select('id', { count: 'exact' }),
        supabase.from('chats').select('id', { count: 'exact' }),
        supabase.from('products').select(`
          *,
          profiles (
            full_name
          )
        `).eq('approved', false).order('created_at', { ascending: false })
      ]);

      // Handle stats
      setStats({
        totalUsers: usersResult.count || 0,
        totalProducts: productsResult.count || 0,
        pendingProducts: productsResult.data?.filter(p => !p.approved).length || 0,
        totalFlats: flatsResult.count || 0,
        totalChats: chatsResult.count || 0
      });

      // Handle pending products with profile data
      const pendingProductsWithProfiles = await Promise.all(
        (pendingResult.data || []).map(async (product) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('user_id', product.user_id)
            .single();
          
          return {
            ...product,
            profiles: profile || { full_name: 'Unknown User' }
          };
        })
      );

      setPendingProducts(pendingProductsWithProfiles);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Error loading dashboard",
        description: "Please try refreshing the page",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProductApproval = async (productId: string, approved: boolean) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ approved })
        .eq('id', productId);

      if (error) throw error;

      toast({
        title: approved ? "Product approved" : "Product rejected",
        description: `Product has been ${approved ? 'approved' : 'rejected'} successfully.`,
      });

      // Refresh data
      fetchDashboardData();
    } catch (error) {
      console.error('Error updating product:', error);
      toast({
        title: "Error",
        description: "Failed to update product status",
        variant: "destructive",
      });
    }
  };

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-4">Access Denied</h1>
          <p className="text-muted-foreground">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage CampusKart platform</p>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{stats.totalUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Package className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Products</p>
                <p className="text-2xl font-bold">{stats.totalProducts}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Home className="w-8 h-8 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Flat Listings</p>
                <p className="text-2xl font-bold">{stats.totalFlats}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <MessageCircle className="w-8 h-8 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Chats</p>
                <p className="text-2xl font-bold">{stats.totalChats}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Approvals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Eye className="w-5 h-5" />
            <span>Pending Product Approvals</span>
            {stats.pendingProducts > 0 && (
              <Badge variant="destructive">{stats.pendingProducts}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendingProducts.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No pending products to review</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingProducts.map((product) => (
                <div key={product.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold">{product.name}</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        By: {product.profiles?.full_name || 'Unknown User'}
                      </p>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-2">
                        <span className="flex items-center">
                          <IndianRupee className="w-4 h-4 mr-1" />
                          {product.price.toLocaleString()}
                        </span>
                        {product.category && (
                          <Badge variant="secondary">{product.category}</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Listed: {new Date(product.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        onClick={() => handleProductApproval(product.id, true)}
                        className="bg-green-500 hover:bg-green-600"
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleProductApproval(product.id, false)}
                      >
                        <X className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}