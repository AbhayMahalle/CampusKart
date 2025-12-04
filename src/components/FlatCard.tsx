import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Home, 
  MapPin, 
  IndianRupee, 
  Bed, 
  Bath, 
  Calendar,
  User,
  Eye
} from 'lucide-react';
import { useState } from 'react';

interface FlatCardProps {
  id: string;
  title: string;
  location: string;
  rent: number;
  flatType?: string | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  imageUrl: string | null;
  isAvailable?: boolean;
  availableFrom?: string | null;
  ownerName?: string;
  createdAt: string;
}

export function FlatCard({
  id,
  title,
  location,
  rent,
  flatType,
  bedrooms,
  bathrooms,
  imageUrl,
  isAvailable = true,
  availableFrom,
  ownerName,
  createdAt,
}: FlatCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Card 
      className="group relative overflow-hidden bg-card border-border/50 hover:border-secondary/30 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container */}
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-subtle">
            <Home className="w-12 h-12 text-muted-foreground/50" />
          </div>
        )}

        {/* Overlay on hover */}
        <div className={`absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-transparent transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`} />

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {flatType && (
            <Badge className="bg-secondary text-secondary-foreground font-medium text-xs">
              {flatType}
            </Badge>
          )}
        </div>

        {/* Status Badge */}
        {!isAvailable && (
          <Badge variant="destructive" className="absolute top-2 right-2 text-xs">
            Not Available
          </Badge>
        )}

        {/* Quick View Button */}
        <div className={`absolute bottom-3 left-1/2 -translate-x-1/2 transition-all duration-300 ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <Button 
            asChild
            size="sm" 
            className="bg-card/95 text-foreground hover:bg-card backdrop-blur-sm shadow-lg"
          >
            <Link to={`/flats/${id}`}>
              <Eye className="w-4 h-4 mr-1" />
              View Details
            </Link>
          </Button>
        </div>
      </div>

      {/* Content */}
      <CardContent className="p-4 space-y-3">
        {/* Title */}
        <h3 className="font-semibold text-foreground line-clamp-1 group-hover:text-secondary transition-colors">
          {title}
        </h3>

        {/* Location */}
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="line-clamp-1">{location}</span>
        </div>

        {/* Rent */}
        <div className="flex items-center">
          <div className="flex items-center text-xl font-bold text-foreground">
            <IndianRupee className="w-5 h-5" />
            <span>{rent.toLocaleString()}</span>
          </div>
          <span className="text-sm text-muted-foreground ml-1">/month</span>
        </div>

        {/* Room Details */}
        {(bedrooms || bathrooms) && (
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {bedrooms && (
              <div className="flex items-center gap-1">
                <Bed className="w-4 h-4" />
                <span>{bedrooms} Bed</span>
              </div>
            )}
            {bathrooms && (
              <div className="flex items-center gap-1">
                <Bath className="w-4 h-4" />
                <span>{bathrooms} Bath</span>
              </div>
            )}
          </div>
        )}

        {/* Available From */}
        {availableFrom && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="w-3 h-3" />
            <span>Available from {new Date(availableFrom).toLocaleDateString()}</span>
          </div>
        )}

        {/* Owner Info */}
        {ownerName && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-2 border-t border-border/50">
            <User className="w-3 h-3" />
            <span>Listed by {ownerName}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
