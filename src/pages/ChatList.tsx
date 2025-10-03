import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, User } from 'lucide-react';

interface Chat {
  id: string;
  sender_id: string;
  receiver_id: string;
  product_id: string | null;
  last_message: string | null;
  updated_at: string;
  profiles?: {
    full_name: string;
  };
}

export function ChatList() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchChats();
    }
  }, [user]);

  const fetchChats = async () => {
    if (!user) return;

    try {
      const { data: chatsData, error } = await supabase
        .from('chats')
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // Fetch profiles for each chat participant
      const chatsWithProfiles = await Promise.all(
        (chatsData || []).map(async (chat) => {
          const otherUserId = chat.sender_id === user.id ? chat.receiver_id : chat.sender_id;
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('user_id', otherUserId)
            .single();
          
          return {
            ...chat,
            profiles: profile || { full_name: 'Unknown User' }
          };
        })
      );

      setChats(chatsWithProfiles);
    } catch (error) {
      console.error('Error fetching chats:', error);
      toast({
        title: "Error loading chats",
        description: "Please try refreshing the page",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2">Loading chats...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center shadow-glow">
            <MessageCircle className="w-6 h-6 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Messages
          </h1>
        </div>
        {chats.length > 0 && (
          <Badge variant="secondary" className="text-sm">
            {chats.length} {chats.length === 1 ? 'conversation' : 'conversations'}
          </Badge>
        )}
      </div>

      {chats.length === 0 ? (
        <Card className="border-2 border-dashed border-muted-foreground/20 shadow-none">
          <CardContent className="p-12 text-center">
            <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-10 h-10 text-primary/40" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No conversations yet</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Start chatting with sellers by clicking the "Chat with Seller" button on any product listing
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {chats.map((chat) => {
            const otherUserId = chat.sender_id === user.id ? chat.receiver_id : chat.sender_id;
            
            return (
              <Card 
                key={chat.id} 
                className="cursor-pointer hover:shadow-md hover:scale-[1.01] transition-all duration-200 border border-border/50 hover:border-primary/50"
                onClick={() => window.location.href = `/chat/${chat.id}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <div className="w-14 h-14 bg-gradient-primary rounded-full flex items-center justify-center shadow-elegant">
                        <User className="w-7 h-7 text-primary-foreground" />
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-success rounded-full border-2 border-card"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg mb-1">
                        {chat.profiles?.full_name || 'Anonymous User'}
                      </h3>
                      {chat.last_message ? (
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {chat.last_message}
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">
                          No messages yet
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <p className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(chat.updated_at).toLocaleDateString('en-IN', { 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </p>
                      <MessageCircle className="w-5 h-5 text-primary" />
                    </div>
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

export default ChatList;