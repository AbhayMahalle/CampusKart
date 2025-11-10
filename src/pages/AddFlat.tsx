import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ImageUpload } from '@/components/ImageUpload';
import { Loader2, ArrowLeft } from 'lucide-react';

interface FlatFormData {
  title: string;
  location: string;
  rent: string;
  description: string;
  bedrooms: string;
  bathrooms: string;
  flat_type: string;
  available_from: string;
  contact_number: string;
  image_url: string;
}

export default function AddFlat() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FlatFormData>({
    title: '',
    location: '',
    rent: '',
    description: '',
    bedrooms: '1',
    bathrooms: '1',
    flat_type: '1BHK',
    available_from: '',
    contact_number: '',
    image_url: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageUploaded = (url: string) => {
    setFormData(prev => ({ ...prev, image_url: url }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validate phone number
    const phoneRegex = /^\+?[1-9]\d{9,14}$/;
    const cleanedPhone = formData.contact_number.replace(/\s/g, '');
    
    if (!cleanedPhone || !phoneRegex.test(cleanedPhone)) {
      toast({
        title: "Invalid phone number",
        description: "Please enter a valid WhatsApp number with country code (e.g., +919876543210)",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('flat_listings')
        .insert({
          user_id: user.id,
          title: formData.title,
          location: formData.location,
          rent: parseFloat(formData.rent),
          description: formData.description || null,
          bedrooms: parseInt(formData.bedrooms) || null,
          bathrooms: parseInt(formData.bathrooms) || null,
          flat_type: formData.flat_type || null,
          available_from: formData.available_from || null,
          contact_number: cleanedPhone,
          image_url: formData.image_url || null,
          is_available: true
        });

      if (error) throw error;

      toast({
        title: "Flat listing created successfully!",
        description: "Your flat is now available for others to view.",
      });

      navigate('/flats');
    } catch (error) {
      console.error('Error creating flat listing:', error);
      toast({
        title: "Error creating listing",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/flats')}
            className="p-2"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">List Your Flat</h1>
            <p className="text-muted-foreground">Help fellow students find their next home</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Flat Details</CardTitle>
            <CardDescription>
              Provide details about your flat to help potential flatmates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Image Upload */}
              <div className="space-y-2">
                <Label>Flat Images</Label>
                <ImageUpload
                  onImageUploaded={handleImageUploaded}
                  currentImage={formData.image_url}
                />
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  name="title"
                  type="text"
                  placeholder="2BHK Near Campus"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                />
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  name="location"
                  type="text"
                  placeholder="Pune, Maharashtra"
                  value={formData.location}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {/* Rent */}
                <div className="space-y-2">
                  <Label htmlFor="rent">Monthly Rent (₹) *</Label>
                  <Input
                    id="rent"
                    name="rent"
                    type="number"
                    placeholder="8000"
                    value={formData.rent}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                {/* Flat Type */}
                <div className="space-y-2">
                  <Label>Flat Type</Label>
                  <Select
                    value={formData.flat_type}
                    onValueChange={(value) => handleSelectChange('flat_type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1RK">1RK</SelectItem>
                      <SelectItem value="1BHK">1BHK</SelectItem>
                      <SelectItem value="2BHK">2BHK</SelectItem>
                      <SelectItem value="3BHK">3BHK</SelectItem>
                      <SelectItem value="4BHK">4BHK</SelectItem>
                      <SelectItem value="PG">PG</SelectItem>
                      <SelectItem value="Shared Room">Shared Room</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {/* Bedrooms */}
                <div className="space-y-2">
                  <Label>Bedrooms</Label>
                  <Select
                    value={formData.bedrooms}
                    onValueChange={(value) => handleSelectChange('bedrooms', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1</SelectItem>
                      <SelectItem value="2">2</SelectItem>
                      <SelectItem value="3">3</SelectItem>
                      <SelectItem value="4">4</SelectItem>
                      <SelectItem value="5">5+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Bathrooms */}
                <div className="space-y-2">
                  <Label>Bathrooms</Label>
                  <Select
                    value={formData.bathrooms}
                    onValueChange={(value) => handleSelectChange('bathrooms', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1</SelectItem>
                      <SelectItem value="2">2</SelectItem>
                      <SelectItem value="3">3</SelectItem>
                      <SelectItem value="4">4</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Available From */}
              <div className="space-y-2">
                <Label htmlFor="available_from">Available From</Label>
                <Input
                  id="available_from"
                  name="available_from"
                  type="date"
                  value={formData.available_from}
                  onChange={handleInputChange}
                />
              </div>

              {/* Contact Number */}
              <div className="space-y-2">
                <Label htmlFor="contact_number">WhatsApp Number *</Label>
                <Input
                  id="contact_number"
                  name="contact_number"
                  type="tel"
                  placeholder="+919876543210"
                  value={formData.contact_number}
                  onChange={handleInputChange}
                  required
                  pattern="^\+?[1-9]\d{9,14}$"
                  title="Enter phone number with country code (e.g., +919876543210)"
                />
                <p className="text-xs text-muted-foreground">
                  Include country code (e.g., +91 for India). Interested users will contact you on WhatsApp.
                </p>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Describe your flat, amenities, nearby facilities, etc."
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/flats')}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  List Flat
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}