import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ArrowLeft, Send, User } from 'lucide-react';

interface Message {
  id: string;
  message: string;
  sender_id: string;
  receiver_id: string;
  timestamp: string;
  chat_id: string;
}

interface ChatDetails {
  id: string;
  sender_id: string;
  receiver_id: string;
  product_id: string | null;
  last_message: string | null;
}

interface Profile {
  user_id: string;
  full_name: string;
}

export default function ChatWindow() {
  const { chatId } = useParams();
  const [searchParams] = useSearchParams();
  const receiverId = searchParams.get('receiver');
  const productId = searchParams.get('product');
  
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [chatDetails, setChatDetails] = useState<ChatDetails | null>(null);
  const [otherUser, setOtherUser] = useState<Profile | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      if (chatId) {
        // Load existing chat
        loadChat();
      } else if (receiverId && productId) {
        // Create or find chat for this product/user combination
        findOrCreateChat();
      } else {
        navigate('/chat');
      }
    }
  }, [user, chatId, receiverId, productId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (chatDetails) {
      // Set up real-time subscription for messages
      const channel = supabase
        .channel('chat-messages')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `chat_id=eq.${chatDetails.id}`
          },
          (payload) => {
            const newMessage = payload.new as Message;
            setMessages(prev => [...prev, newMessage]);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [chatDetails]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChat = async () => {
    if (!chatId || !user) return;

    try {
      // Get chat details
      const { data: chat, error: chatError } = await supabase
        .from('chats')
        .select('*')
        .eq('id', chatId)
        .single();

      if (chatError) throw chatError;

      // Verify user is part of this chat
      if (chat.sender_id !== user.id && chat.receiver_id !== user.id) {
        toast({
          title: "Access denied",
          description: "You don't have permission to view this chat",
          variant: "destructive",
        });
        navigate('/chat');
        return;
      }

      setChatDetails(chat);

      // Get other user's profile
      const otherUserId = chat.sender_id === user.id ? chat.receiver_id : chat.sender_id;
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .eq('user_id', otherUserId)
        .single();

      setOtherUser(profile);

      // Load messages
      const { data: chatMessages, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('timestamp', { ascending: true });

      if (messagesError) throw messagesError;
      setMessages(chatMessages || []);

    } catch (error) {
      console.error('Error loading chat:', error);
      toast({
        title: "Error loading chat",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const findOrCreateChat = async () => {
    if (!user || !receiverId || !productId) return;

    try {
      // Check if chat already exists
      const { data: existingChat } = await supabase
        .from('chats')
        .select('*')
        .eq('product_id', productId)
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${user.id})`)
        .single();

      if (existingChat) {
        setChatDetails(existingChat);
        navigate(`/chat/${existingChat.id}`, { replace: true });
        return;
      }

      // Create new chat
      const { data: newChat, error: chatError } = await supabase
        .from('chats')
        .insert({
          sender_id: user.id,
          receiver_id: receiverId,
          product_id: productId
        })
        .select()
        .single();

      if (chatError) throw chatError;

      setChatDetails(newChat);
      navigate(`/chat/${newChat.id}`, { replace: true });

      // Get other user's profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .eq('user_id', receiverId)
        .single();

      setOtherUser(profile);

    } catch (error) {
      console.error('Error creating chat:', error);
      toast({
        title: "Error creating chat",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !chatDetails || !user || sending) return;

    setSending(true);

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          chat_id: chatDetails.id,
          sender_id: user.id,
          receiver_id: chatDetails.sender_id === user.id ? chatDetails.receiver_id : chatDetails.sender_id,
          message: newMessage.trim()
        });

      if (error) throw error;

      // Update chat's last message
      await supabase
        .from('chats')
        .update({ 
          last_message: newMessage.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', chatDetails.id);

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error sending message",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2">Loading chat...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card className="h-[600px] flex flex-col">
        {/* Chat Header */}
        <CardHeader className="border-b">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/chat')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Avatar>
              <AvatarFallback>
                <User className="w-4 h-4" />
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">
                {otherUser?.full_name || 'Chat User'}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {productId ? 'About a product' : 'General chat'}
              </p>
            </div>
          </div>
        </CardHeader>

        {/* Messages Area */}
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground">
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.sender_id === user?.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <p className="text-sm">{message.message}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </CardContent>

        {/* Message Input */}
        <div className="border-t p-4">
          <div className="flex space-x-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              disabled={sending}
            />
            <Button
              onClick={sendMessage}
              disabled={sending || !newMessage.trim()}
              size="icon"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}