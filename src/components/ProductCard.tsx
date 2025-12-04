import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Heart, ShoppingBag, IndianRupee, Star, Eye } from 'lucide-react';
import { useState } from 'react';

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  imageUrl: string | null;
  category?: string | null;
  isAvailable?: boolean;
  sold?: boolean;
  sellerName?: string;
  college?: string;
  isInWishlist?: boolean;
  onWishlistToggle?: (id: string) => void;
  showWishlist?: boolean;
  rating?: number;
}

export function ProductCard({
  id,
  name,
  price,
  originalPrice,
  imageUrl,
  category,
  isAvailable = true,
  sold = false,
  sellerName,
  college,
  isInWishlist = false,
  onWishlistToggle,
  showWishlist = true,
  rating,
}: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const discount = originalPrice ? Math.round(((originalPrice - price) / originalPrice) * 100) : null;

  const getStatusBadge = () => {
    if (sold) return { label: 'Sold', variant: 'destructive' as const };
    if (!isAvailable) return { label: 'Unavailable', variant: 'secondary' as const };
    return null;
  };

  const status = getStatusBadge();

  return (
    <Card 
      className="group relative overflow-hidden bg-card border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-muted">
        <Link to={`/products/${id}`}>
          {imageUrl ? (
            <img 
              src={imageUrl} 
              alt={name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-subtle">
              <ShoppingBag className="w-12 h-12 text-muted-foreground/50" />
            </div>
          )}
        </Link>

        {/* Overlay on hover */}
        <div className={`absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-transparent transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`} />

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {discount && discount > 0 && (
            <Badge className="bg-accent text-accent-foreground font-bold text-xs px-2 py-0.5">
              {discount}% OFF
            </Badge>
          )}
          {category && (
            <Badge variant="secondary" className="text-xs bg-card/90 backdrop-blur-sm">
              {category}
            </Badge>
          )}
        </div>

        {/* Status Badge */}
        {status && (
          <Badge 
            variant={status.variant} 
            className="absolute top-2 right-2 text-xs"
          >
            {status.label}
          </Badge>
        )}

        {/* Wishlist Button */}
        {showWishlist && onWishlistToggle && (
          <Button
            variant="ghost"
            size="icon"
            className={`absolute top-2 right-2 w-8 h-8 rounded-full bg-card/90 backdrop-blur-sm hover:bg-card transition-all ${status ? 'top-10' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              onWishlistToggle(id);
            }}
          >
            <Heart 
              className={`w-4 h-4 transition-colors ${isInWishlist ? 'fill-accent text-accent' : 'text-muted-foreground'}`}
            />
          </Button>
        )}

        {/* Quick View Button */}
        <div className={`absolute bottom-3 left-1/2 -translate-x-1/2 transition-all duration-300 ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <Button 
            asChild
            size="sm" 
            className="bg-card/95 text-foreground hover:bg-card backdrop-blur-sm shadow-lg"
          >
            <Link to={`/products/${id}`}>
              <Eye className="w-4 h-4 mr-1" />
              Quick View
            </Link>
          </Button>
        </div>
      </div>

      {/* Content */}
      <CardContent className="p-3 space-y-2">
        {/* Product Name */}
        <Link to={`/products/${id}`}>
          <h3 className="font-medium text-sm text-foreground line-clamp-2 hover:text-primary transition-colors min-h-[2.5rem]">
            {name}
          </h3>
        </Link>

        {/* Rating */}
        {rating && (
          <div className="flex items-center gap-1">
            <div className="flex items-center gap-0.5 bg-success/10 text-success px-1.5 py-0.5 rounded text-xs font-medium">
              <span>{rating.toFixed(1)}</span>
              <Star className="w-3 h-3 fill-success" />
            </div>
          </div>
        )}

        {/* Price */}
        <div className="flex items-center gap-2">
          <div className="flex items-center text-lg font-bold text-foreground">
            <IndianRupee className="w-4 h-4" />
            <span>{price.toLocaleString()}</span>
          </div>
          {originalPrice && originalPrice > price && (
            <span className="text-sm text-muted-foreground line-through">
              ₹{originalPrice.toLocaleString()}
            </span>
          )}
        </div>

        {/* Seller Info */}
        {sellerName && (
          <p className="text-xs text-muted-foreground truncate">
            by {sellerName} {college && `• ${college}`}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
