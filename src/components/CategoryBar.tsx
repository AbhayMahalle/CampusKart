import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { 
  Laptop, 
  BookOpen, 
  Shirt, 
  Dumbbell, 
  Music, 
  Gamepad2, 
  Bike, 
  Home,
  Smartphone,
  Camera,
  Package
} from 'lucide-react';

interface Category {
  name: string;
  icon: React.ElementType;
  color: string;
}

const categories: Category[] = [
  { name: 'Electronics', icon: Laptop, color: 'bg-blue-500/10 text-blue-600 hover:bg-blue-500/20' },
  { name: 'Books', icon: BookOpen, color: 'bg-amber-500/10 text-amber-600 hover:bg-amber-500/20' },
  { name: 'Fashion', icon: Shirt, color: 'bg-pink-500/10 text-pink-600 hover:bg-pink-500/20' },
  { name: 'Sports', icon: Dumbbell, color: 'bg-green-500/10 text-green-600 hover:bg-green-500/20' },
  { name: 'Music', icon: Music, color: 'bg-purple-500/10 text-purple-600 hover:bg-purple-500/20' },
  { name: 'Gaming', icon: Gamepad2, color: 'bg-red-500/10 text-red-600 hover:bg-red-500/20' },
  { name: 'Vehicles', icon: Bike, color: 'bg-orange-500/10 text-orange-600 hover:bg-orange-500/20' },
  { name: 'Furniture', icon: Home, color: 'bg-teal-500/10 text-teal-600 hover:bg-teal-500/20' },
  { name: 'Mobile', icon: Smartphone, color: 'bg-indigo-500/10 text-indigo-600 hover:bg-indigo-500/20' },
  { name: 'Photography', icon: Camera, color: 'bg-cyan-500/10 text-cyan-600 hover:bg-cyan-500/20' },
  { name: 'Others', icon: Package, color: 'bg-gray-500/10 text-gray-600 hover:bg-gray-500/20' },
];

interface CategoryBarProps {
  selectedCategory?: string;
  onCategorySelect: (category: string | null) => void;
}

export function CategoryBar({ selectedCategory, onCategorySelect }: CategoryBarProps) {
  return (
    <div className="bg-card border-b border-border">
      <div className="container mx-auto px-4">
        <ScrollArea className="w-full whitespace-nowrap py-4">
          <div className="flex items-center gap-3">
            <Button
              variant={!selectedCategory ? "default" : "ghost"}
              size="sm"
              onClick={() => onCategorySelect(null)}
              className="flex-shrink-0"
            >
              All
            </Button>
            {categories.map((category) => {
              const Icon = category.icon;
              const isSelected = selectedCategory === category.name;
              return (
                <Button
                  key={category.name}
                  variant="ghost"
                  size="sm"
                  onClick={() => onCategorySelect(category.name)}
                  className={`flex-shrink-0 gap-2 transition-all ${
                    isSelected 
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
                      : category.color
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{category.name}</span>
                </Button>
              );
            })}
          </div>
          <ScrollBar orientation="horizontal" className="invisible" />
        </ScrollArea>
      </div>
    </div>
  );
}
