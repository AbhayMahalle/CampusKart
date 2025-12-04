import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles, Tag, TrendingUp } from 'lucide-react';

interface PromoBannerProps {
  variant?: 'primary' | 'accent' | 'gradient';
}

export function PromoBanner({ variant = 'primary' }: PromoBannerProps) {
  const variants = {
    primary: 'bg-gradient-to-r from-primary via-primary-variant to-secondary',
    accent: 'bg-gradient-to-r from-accent via-accent-light to-warning',
    gradient: 'bg-gradient-hero',
  };

  return (
    <div className={`${variants[variant]} rounded-2xl overflow-hidden relative`}>
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-40 h-40 bg-white/20 rounded-full -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-60 h-60 bg-white/20 rounded-full translate-x-1/3 translate-y-1/3" />
        <div className="absolute top-1/2 left-1/2 w-32 h-32 bg-white/10 rounded-full" />
      </div>

      <div className="relative p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 text-white">
          <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
            <Sparkles className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-xl md:text-2xl font-bold">
              Sell Your Items Today!
            </h3>
            <p className="text-white/90 text-sm md:text-base">
              List your products and reach thousands of students
            </p>
          </div>
        </div>
        
        <Button 
          asChild
          size="lg" 
          className="bg-white text-foreground hover:bg-white/90 shadow-lg"
        >
          <Link to="/add-product">
            Start Selling
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

export function DealsBanner() {
  return (
    <div className="bg-gradient-to-r from-warning/20 via-accent/20 to-primary/20 border border-warning/30 rounded-xl p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-warning/20 rounded-lg flex items-center justify-center">
            <Tag className="w-5 h-5 text-warning" />
          </div>
          <div>
            <p className="font-semibold text-foreground">Today's Deals</p>
            <p className="text-sm text-muted-foreground">Check out the latest offers</p>
          </div>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link to="/products">
            View All
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

export function TrendingBanner() {
  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-success/10 rounded-lg">
      <TrendingUp className="w-4 h-4 text-success" />
      <span className="text-sm font-medium text-success">Trending Now</span>
    </div>
  );
}
