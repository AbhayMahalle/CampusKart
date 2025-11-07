import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ShoppingBag, Users, MessageCircle, Building2, Loader2 } from 'lucide-react';
import heroImage from '@/assets/hero-image.jpg';

export default function Landing() {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    college: ''
  });

  const { signIn, signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let result;
      if (isLogin) {
        result = await signIn(formData.email, formData.password);
      } else {
        result = await signUp(formData.email, formData.password, formData.fullName, formData.college);
      }

      if (result.error) {
        toast({
          title: "Authentication Error",
          description: result.error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: isLogin ? "Welcome back!" : "Account created successfully!",
          description: isLogin ? "Redirecting to dashboard..." : "You can now sign in.",
        });
        
        if (isLogin) {
          setTimeout(() => {
            navigate('/dashboard');
          }, 100);
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Header */}
      <header className="relative z-10 bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">CampusKart</span>
            </div>
          </div>
        </div>
      </header>

      <main className="relative">
        {/* Hero Section */}
        <section className="relative py-20 overflow-hidden">
          <div className="absolute inset-0">
            <img 
              src={heroImage} 
              alt="College students trading items" 
              className="w-full h-full object-cover opacity-20"
            />
            <div className="absolute inset-0 bg-gradient-hero opacity-80"></div>
          </div>
          
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left Column - Hero Content */}
              <div className="text-center lg:text-left">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 animate-fade-in">
                  Your Campus
                  <span className="block bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                    Marketplace
                  </span>
                </h1>
                <p className="text-xl text-white/90 mb-8 animate-fade-in">
                  Buy, sell, and trade with fellow students. Find flatmates, chat securely, and build your campus community.
                </p>

                {/* Features */}
                <div className="grid sm:grid-cols-2 gap-4 mb-8 animate-slide-in-right">
                  <div className="flex items-center space-x-3 text-white/90">
                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                      <ShoppingBag className="w-5 h-5" />
                    </div>
                    <span>Buy & Sell Items</span>
                  </div>
                  <div className="flex items-center space-x-3 text-white/90">
                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <span>Find Flatmates</span>
                  </div>
                  <div className="flex items-center space-x-3 text-white/90">
                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                      <MessageCircle className="w-5 h-5" />
                    </div>
                    <span>Chat Securely</span>
                  </div>
                  <div className="flex items-center space-x-3 text-white/90">
                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                      <Users className="w-5 h-5" />
                    </div>
                    <span>Campus Community</span>
                  </div>
                </div>
              </div>

              {/* Right Column - Auth Form */}
              <div className="flex justify-center lg:justify-end">
                <Card className="w-full max-w-md bg-white/95 backdrop-blur-md shadow-glow border-white/20">
                  <CardHeader className="text-center">
                    <CardTitle className="text-2xl bg-gradient-primary bg-clip-text text-transparent">
                      {isLogin ? 'Welcome Back' : 'Join CampusKart'}
                    </CardTitle>
                    <CardDescription>
                      {isLogin 
                        ? 'Sign in to access your account' 
                        : 'Create your account to get started'
                      }
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      {!isLogin && (
                        <>
                          <div className="space-y-2">
                            <Label htmlFor="fullName">Full Name</Label>
                            <Input
                              id="fullName"
                              name="fullName"
                              type="text"
                              placeholder="John Doe"
                              value={formData.fullName}
                              onChange={handleInputChange}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="college">College/University</Label>
                            <Input
                              id="college"
                              name="college"
                              type="text"
                              placeholder="MIT"
                              value={formData.college}
                              onChange={handleInputChange}
                              required
                            />
                          </div>
                        </>
                      )}
                      
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          placeholder="you@college.edu"
                          value={formData.email}
                          onChange={handleInputChange}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                          id="password"
                          name="password"
                          type="password"
                          placeholder="••••••••"
                          value={formData.password}
                          onChange={handleInputChange}
                          required
                        />
                      </div>

                      <Button 
                        type="submit" 
                        variant="hero" 
                        size="lg" 
                        className="w-full"
                        disabled={isLoading}
                      >
                        {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                        {isLogin ? 'Sign In' : 'Create Account'}
                      </Button>
                    </form>

                    <Separator className="my-6" />

                    <div className="text-center space-y-3">
                      <p className="text-sm text-muted-foreground mb-4">
                        {isLogin ? "Don't have an account?" : "Already have an account?"}
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => setIsLogin(!isLogin)}
                        className="w-full"
                        disabled={isLoading}
                      >
                        {isLogin ? 'Create Account' : 'Sign In'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}