import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { WhatsAppButton } from '@/components/ui/whatsapp-button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Plus, 
  Search, 
  User,
  IndianRupee,
  Calendar,
  MapPin,
  Bed,
  Bath,
  Home,
  Filter,
  SortAsc,
  Phone,
  MoreVertical,
  Trash2,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface FlatListing {
  id: string;
  title: string;
  location: string;
  rent: number;
  description: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  flat_type: string | null;
  available_from: string | null;
  contact_number: string | null;
  image_url: string | null;
  is_available: boolean;
  created_at: string;
  user_id: string;
  profiles?: {
    full_name: string;
    phone: string | null;
  };
}

type SortOption = 'newest' | 'oldest' | 'rent_low' | 'rent_high';

export default function FlatListings() {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [flats, setFlats] = useState<FlatListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const showOnlyMyFlats = searchParams.get('filter') === 'mine';

  const flatTypes = ['1RK', '1BHK', '2BHK', '3BHK', '4BHK', 'PG', 'Shared Room'];

  useEffect(() => {
    fetchFlats();

    // Set up real-time subscription for flat listings
    const flatsChannel = supabase
      .channel('flats-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'flat_listings'
        },
        (payload) => {
          // Handle real-time updates
          if (payload.eventType === 'UPDATE') {
            const updatedFlat = payload.new as FlatListing;
            setFlats(prev => {
              const index = prev.findIndex(f => f.id === updatedFlat.id);
              if (index === -1) {
                // Flat not in current list, fetch to get profile data
                fetchFlats();
                return prev;
              } else {
                // Update existing flat, preserve profile data
                const newFlats = [...prev];
                newFlats[index] = { ...updatedFlat, profiles: prev[index].profiles };
                return newFlats;
              }
            });
          } else if (payload.eventType === 'DELETE') {
            const deletedFlat = payload.old as FlatListing;
            setFlats(prev => prev.filter(f => f.id !== deletedFlat.id));
          } else if (payload.eventType === 'INSERT') {
            // Refetch to get profile data for new flat
            fetchFlats();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(flatsChannel);
    };
  }, [sortBy, showOnlyMyFlats, user]);

  const fetchFlats = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('flat_listings')
        .select('*');

      // If showing only user's flats, filter by user_id and show all (available/unavailable)
      if (showOnlyMyFlats && user) {
        query = query.eq('user_id', user.id);
      }
      // For general browse, show all flats so users can see availability status

      // Apply sorting
      switch (sortBy) {
        case 'newest':
          query = query.order('created_at', { ascending: false });
          break;
        case 'oldest':
          query = query.order('created_at', { ascending: true });
          break;
        case 'rent_low':
          query = query.order('rent', { ascending: true });
          break;
        case 'rent_high':
          query = query.order('rent', { ascending: false });
          break;
      }

      const { data: flatsData, error } = await query;

      if (error) throw error;

      // Fetch profiles for each flat owner
      const flatsWithProfiles = await Promise.all(
        (flatsData || []).map(async (flat) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, phone')
            .eq('user_id', flat.user_id)
            .maybeSingle();
          
          return {
            ...flat,
            profiles: profile || { full_name: 'Unknown User', phone: null }
          };
        })
      );

      setFlats(flatsWithProfiles);
    } catch (error) {
      console.error('Error fetching flats:', error);
      toast({
        title: "Error loading flats",
        description: "Please try refreshing the page",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (flatId: string, status: 'available' | 'unavailable') => {
    try {
      const updates: any = {};
      
      if (status === 'available') {
        updates.is_available = true;
      } else if (status === 'unavailable') {
        updates.is_available = false;
      }

      const { error } = await supabase
        .from('flat_listings')
        .update(updates)
        .eq('id', flatId);

      if (error) throw error;

      // Real-time update will handle the UI refresh automatically
      // But we still fetch to ensure profile data is included
      fetchFlats();
      toast({
        title: "Status Updated",
        description: `Flat marked as ${status}`
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "Failed to update flat status",
        variant: "destructive"
      });
    }
  };

  const handleDeleteFlat = async (flatId: string) => {
    if (!confirm('Are you sure you want to delete this flat listing?')) return;

    try {
      const { error } = await supabase
        .from('flat_listings')
        .delete()
        .eq('id', flatId);

      if (error) throw error;

      // Real-time update will handle the UI refresh automatically
      // Flat will be removed from all users' views immediately
      toast({
        title: "Flat Deleted",
        description: "Your flat listing has been removed"
      });
    } catch (error) {
      console.error('Error deleting flat:', error);
      toast({
        title: "Error",
        description: "Failed to delete flat listing",
        variant: "destructive"
      });
    }
  };


  // Filter flats based on search and type
  const filteredFlats = flats.filter(flat => {
    const matchesSearch = flat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         flat.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (flat.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    const matchesType = selectedType === 'all' || flat.flat_type === selectedType;
    return matchesSearch && matchesType;
  });

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">Flat Listings</h1>
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <Skeleton className="h-48 w-full" />
                <CardContent className="p-4 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-1/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">
            {showOnlyMyFlats ? 'Your Flat Listings' : 'Flat Listings'}
          </h1>
          <p className="text-muted-foreground">
            {showOnlyMyFlats 
              ? `${filteredFlats.length} of your flats` 
              : `${filteredFlats.length} flats available`
            }
          </p>
        </div>
        <Link to="/add-flat">
          <Button className="w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            List Your Flat
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search flats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger>
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Flat Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {flatTypes.map(type => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
          <SelectTrigger>
            <SortAsc className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="oldest">Oldest First</SelectItem>
            <SelectItem value="rent_low">Rent: Low to High</SelectItem>
            <SelectItem value="rent_high">Rent: High to Low</SelectItem>
          </SelectContent>
        </Select>

        <div className="text-sm text-muted-foreground flex items-center">
          <Home className="w-4 h-4 mr-2" />
          {filteredFlats.length} results
        </div>
      </div>

      {/* Flats Grid */}
      {filteredFlats.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Home className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No flats found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || selectedType !== 'all' 
                ? 'Try adjusting your search or filters' 
                : 'Be the first to list a flat!'
              }
            </p>
            <Link to="/add-flat">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                List Your Flat
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFlats.map((flat) => {
            const hasWhatsApp = Boolean(flat.contact_number || flat.profiles?.phone);
            const isOwnListing = flat.user_id === user?.id;

            return (
              <Card key={flat.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                {/* Flat Image */}
                <div className="relative h-48 bg-muted">
                  {flat.image_url ? (
                    <img
                      src={flat.image_url}
                      alt={flat.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <Home className="w-12 h-12 text-muted-foreground" />
                    </div>
                  )}
                </div>

                <CardContent className="p-4">
                  <div className="space-y-3">
                    {/* Title & Type */}
                    <div>
                      <h3 className="font-semibold text-lg line-clamp-1">{flat.title}</h3>
                      <div className="flex items-center space-x-2 mt-1">
                        {flat.flat_type && (
                          <Badge variant="secondary" className="text-xs">
                            {flat.flat_type}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Location */}
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span className="line-clamp-1">{flat.location}</span>
                    </div>

                    {/* Rent */}
                    <div className="flex items-center font-bold text-xl text-primary">
                      <IndianRupee className="w-5 h-5" />
                      {flat.rent.toLocaleString()}
                      <span className="text-sm font-normal text-muted-foreground ml-1">/month</span>
                    </div>

                    {/* Room Details */}
                    {(flat.bedrooms || flat.bathrooms) && (
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        {flat.bedrooms && (
                          <div className="flex items-center space-x-1">
                            <Bed className="w-4 h-4" />
                            <span>{flat.bedrooms} bed</span>
                          </div>
                        )}
                        {flat.bathrooms && (
                          <div className="flex items-center space-x-1">
                            <Bath className="w-4 h-4" />
                            <span>{flat.bathrooms} bath</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Description */}
                    {flat.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {flat.description}
                      </p>
                    )}

                    {/* Owner Info */}
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <User className="w-4 h-4" />
                      <span>{flat.profiles?.full_name || 'Anonymous'}</span>
                    </div>

                    {/* Contact Number */}
                    {!isOwnListing && (flat.contact_number || flat.profiles?.phone) && (
                      <a 
                        href={`tel:${flat.contact_number || flat.profiles?.phone}`}
                        className="flex items-center space-x-2 text-sm text-primary hover:underline"
                      >
                        <Phone className="w-4 h-4" />
                        <span>{flat.contact_number || flat.profiles?.phone}</span>
                      </a>
                    )}

                    {/* Available From */}
                    {flat.available_from && (
                      <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        <span>Available from {new Date(flat.available_from).toLocaleDateString()}</span>
                      </div>
                    )}

                    {/* Posted Date */}
                    <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      <span>Posted {new Date(flat.created_at).toLocaleDateString()}</span>
                    </div>

                    {/* Status Badge and Actions */}
                    <div className="flex items-center justify-between gap-2 pt-2">
                      {isOwnListing ? (
                        <>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleStatusUpdate(flat.id, 'available')}>
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Mark as Available
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStatusUpdate(flat.id, 'unavailable')}>
                                <XCircle className="w-4 h-4 mr-2" />
                                Mark as Unavailable
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeleteFlat(flat.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete Flat
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                          <Badge variant={flat.is_available ? "default" : "secondary"}>
                            {flat.is_available ? "Available" : "Unavailable"}
                          </Badge>
                        </>
                      ) : (
                        <>
                          <Badge variant={flat.is_available ? "default" : "secondary"}>
                            {flat.is_available ? "Available" : "Unavailable"}
                          </Badge>
                        </>
                      )}
                    </div>

                    {/* Contact Buttons */}
                    {!isOwnListing && flat.is_available && (
                      <div className="pt-2">
                        <WhatsAppButton
                          phone={flat.contact_number || flat.profiles?.phone}
                          message={`Hi ${flat.profiles?.full_name || ''}, I saw your flat listing '${flat.title}' on CampusKart. I'm interested in learning more about it.`}
                          productName={flat.title}
                          size="sm"
                          className="w-full"
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}