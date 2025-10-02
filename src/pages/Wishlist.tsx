import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Heart, Package, Trash2, IndianRupee } from 'lucide-react';

interface WishlistItem {
  id: string;
  product_id: string;
  products: {
    id: string;
    name: string;
    description: string;
    price: number;
    image_url: string | null;
    is_available: boolean;
  };
}

export default function Wishlist() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchWishlist();
    }
  }, [user]);

  const fetchWishlist = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('wishlist')
        .select(`
          id,
          product_id,
          products (
            id,
            name,
            description,
            price,
            image_url,
            is_available
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching wishlist:', error);
        toast({
          title: "Error loading wishlist",
          description: "Could not load your wishlist.",
          variant: "destructive",
        });
        return;
      }

      setWishlistItems(data || []);
    } catch (error) {
      console.error('Error in fetchWishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = async (wishlistItemId: string) => {
    try {
      const { error } = await supabase
        .from('wishlist')
        .delete()
        .eq('id', wishlistItemId);

      if (error) {
        console.error('Error removing from wishlist:', error);
        toast({
          title: "Error",
          description: "Could not remove item from wishlist.",
          variant: "destructive",
        });
        return;
      }

      setWishlistItems(prev => prev.filter(item => item.id !== wishlistItemId));
      toast({
        title: "Removed from wishlist",
        description: "Item removed from your wishlist.",
      });
    } catch (error) {
      console.error('Error in removeFromWishlist:', error);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-80 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center space-x-2">
          <Heart className="w-8 h-8 text-accent" />
          <span>My Wishlist</span>
        </h1>
        <p className="text-muted-foreground">
          Items you're interested in buying
        </p>
      </div>

      {wishlistItems.length === 0 ? (
        <div className="text-center py-12">
          <Heart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Your wishlist is empty</h3>
          <p className="text-muted-foreground mb-6">
            Browse products to add items to your wishlist
          </p>
          <Button asChild>
            <a href="/products">Browse Products</a>
          </Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {wishlistItems.map((item) => (
            <Card key={item.id} className="hover:shadow-card-hover transition-shadow">
              <CardHeader className="pb-2">
                <div className="aspect-square bg-muted rounded-lg mb-3 overflow-hidden">
                  {item.products.image_url ? (
                    <img 
                      src={item.products.image_url} 
                      alt={item.products.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-12 h-12 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <CardTitle className="line-clamp-1">{item.products.name}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {item.products.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center text-2xl font-bold text-primary">
                    <IndianRupee className="w-5 h-5" />
                    {item.products.price.toLocaleString()}
                  </div>
                  {!item.products.is_available && (
                    <span className="px-2 py-1 bg-destructive text-destructive-foreground text-xs rounded-md">
                      Sold Out
                    </span>
                  )}
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => removeFromWishlist(item.id)}
                  className="w-full"
                >
                  <Trash2 className="w-4 h-4" />
                  Remove from Wishlist
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}