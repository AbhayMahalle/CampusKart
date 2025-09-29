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

export default function ChatList() {
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
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center space-x-2 mb-8">
        <MessageCircle className="w-8 h-8 text-primary" />
        <h1 className="text-3xl font-bold">Messages</h1>
      </div>

      {chats.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <MessageCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No conversations yet</h3>
            <p className="text-muted-foreground">
              Start chatting with sellers by messaging them from product listings
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {chats.map((chat) => (
            <Card key={chat.id} className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">
                      {chat.profiles?.full_name || 'Anonymous User'}
                    </h3>
                    {chat.last_message && (
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {chat.last_message}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {new Date(chat.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant="secondary">
                    <MessageCircle className="w-3 h-3 mr-1" />
                    Chat
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}