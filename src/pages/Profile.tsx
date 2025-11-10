import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { Loader2, User, Phone, Mail, GraduationCap, Shield, LogOut } from 'lucide-react';

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
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
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

    // Validate phone number
    const phoneRegex = /^\+?[1-9]\d{9,14}$/;
    const cleanedPhone = formData.phone.replace(/\s/g, '');
    
    if (!phoneRegex.test(cleanedPhone)) {
      toast({
        title: "Invalid phone number",
        description: "Please enter a valid phone number with country code (e.g., +919876543210)",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          phone: cleanedPhone,
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

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed out successfully",
        description: "See you next time!",
      });
      navigate('/');
    } catch (error) {
      toast({
        title: "Error signing out",
        description: "Please try again.",
        variant: "destructive",
      });
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
                  WhatsApp Number *
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="+919876543210"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  pattern="^\+?[1-9]\d{9,14}$"
                  title="Enter phone number with country code (e.g., +919876543210)"
                />
                <p className="text-xs text-muted-foreground">
                  Required - Include country code (e.g., +91 for India). Used for WhatsApp communication.
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
              <CardTitle>Communication</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium text-sm mb-2">WhatsApp Contact</h4>
                <p className="text-xs text-muted-foreground">
                  {profile.phone 
                    ? 'Buyers and renters will contact you via WhatsApp'
                    : 'Please add your WhatsApp number to enable communication'
                  }
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Account</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Email Address</p>
                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <Button 
                variant="destructive" 
                onClick={handleSignOut}
                className="w-full"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}