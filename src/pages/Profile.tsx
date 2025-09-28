import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ImageUpload } from '@/components/ImageUpload';
import { Loader2, User, Phone, Mail, GraduationCap, Shield } from 'lucide-react';

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  college: string | null;
  avatar_url: string | null;
  role: string;
  created_at: string;
}

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    college: '',
    avatar_url: ''
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      setProfile(data);
      setFormData({
        full_name: data.full_name || '',
        phone: data.phone || '',
        college: data.college || '',
        avatar_url: data.avatar_url || ''
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Error loading profile",
        description: "Please try refreshing the page",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleImageUploaded = (url: string) => {
    setFormData(prev => ({ ...prev, avatar_url: url }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          phone: formData.phone || null,
          college: formData.college || null,
          avatar_url: formData.avatar_url || null,
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Profile updated successfully",
        description: "Your changes have been saved",
      });

      await fetchProfile(); // Refresh profile data
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error updating profile",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="ml-2">Loading profile...</span>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Profile not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center">
          {formData.avatar_url ? (
            <img 
              src={formData.avatar_url} 
              alt="Profile" 
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <User className="w-8 h-8 text-primary-foreground" />
          )}
        </div>
        <div>
          <h1 className="text-3xl font-bold">{profile.full_name}</h1>
          <div className="flex items-center space-x-4 mt-2">
            <Badge variant={profile.role === 'admin' ? 'destructive' : 'secondary'}>
              {profile.role === 'admin' ? (
                <>
                  <Shield className="w-3 h-3 mr-1" />
                  Admin
                </>
              ) : (
                'User'
              )}
            </Badge>
            <span className="text-sm text-muted-foreground">
              Member since {new Date(profile.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Profile Form */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>
              Update your personal information and contact details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Avatar Upload */}
              <div className="space-y-2">
                <Label>Profile Picture</Label>
                <ImageUpload
                  onImageUploaded={handleImageUploaded}
                  currentImage={formData.avatar_url}
                />
              </div>

              <Separator />

              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="full_name">
                  <User className="w-4 h-4 inline mr-2" />
                  Full Name
                </Label>
                <Input
                  id="full_name"
                  name="full_name"
                  type="text"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              {/* Email (readonly) */}
              <div className="space-y-2">
                <Label htmlFor="email">
                  <Mail className="w-4 h-4 inline mr-2" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed. Contact support if needed.
                </p>
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone">
                  <Phone className="w-4 h-4 inline mr-2" />
                  Phone Number (Optional)
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={formData.phone}
                  onChange={handleInputChange}
                />
                <p className="text-xs text-muted-foreground">
                  Add your phone number to enable WhatsApp messaging for your listings
                </p>
              </div>

              {/* College */}
              <div className="space-y-2">
                <Label htmlFor="college">
                  <GraduationCap className="w-4 h-4 inline mr-2" />
                  College/University
                </Label>
                <Input
                  id="college"
                  name="college"
                  type="text"
                  placeholder="MIT"
                  value={formData.college}
                  onChange={handleInputChange}
                />
              </div>

              <Button type="submit" className="w-full" disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Save Changes
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Account Type</span>
                <Badge variant={profile.role === 'admin' ? 'destructive' : 'secondary'}>
                  {profile.role === 'admin' ? 'Admin' : 'User'}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">College</span>
                <span className="text-sm text-muted-foreground">
                  {profile.college || 'Not specified'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Phone</span>
                <span className="text-sm text-muted-foreground">
                  {profile.phone ? 'Added' : 'Not added'}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Privacy Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium text-sm mb-2">WhatsApp Integration</h4>
                  <p className="text-xs text-muted-foreground">
                    {profile.phone 
                      ? 'Users can contact you via WhatsApp for your listings'
                      : 'Add a phone number to enable WhatsApp messaging'
                    }
                  </p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium text-sm mb-2">In-App Chat</h4>
                  <p className="text-xs text-muted-foreground">
                    Users can always contact you through our secure in-app messaging system
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}