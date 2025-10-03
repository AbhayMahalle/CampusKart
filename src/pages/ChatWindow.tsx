import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ArrowLeft, Send, User, MessageCircle } from 'lucide-react';

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
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <Card className="h-[calc(100vh-12rem)] flex flex-col shadow-elegant border-border/50">
        {/* Chat Header */}
        <CardHeader className="border-b bg-gradient-subtle px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/chat')}
                className="hover:bg-background/80"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center shadow-glow">
                  <User className="w-6 h-6 text-primary-foreground" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-success rounded-full border-2 border-card"></div>
              </div>
              <div>
                <CardTitle className="text-xl font-bold">
                  {otherUser?.full_name || 'Chat User'}
                </CardTitle>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  {productId ? (
                    <>
                      <MessageCircle className="w-3 h-3" />
                      About a product
                    </>
                  ) : (
                    'Active now'
                  )}
                </p>
              </div>
            </div>
          </div>
        </CardHeader>

        {/* Messages Area */}
        <CardContent className="flex-1 overflow-y-auto p-6 space-y-4 bg-muted/20">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mb-4">
                <MessageCircle className="w-10 h-10 text-primary/40" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No messages yet</h3>
              <p className="text-muted-foreground max-w-md">
                Start the conversation! Say hello or ask about the product.
              </p>
            </div>
          ) : (
            messages.map((message, index) => {
              const isOwn = message.sender_id === user?.id;
              const showTime = index === 0 || 
                new Date(messages[index - 1].timestamp).getTime() - new Date(message.timestamp).getTime() > 300000;
              
              return (
                <div key={message.id}>
                  {showTime && (
                    <div className="text-center mb-4">
                      <span className="text-xs text-muted-foreground bg-background px-3 py-1 rounded-full">
                        {new Date(message.timestamp).toLocaleDateString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  )}
                  <div
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'} animate-fade-in`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-sm ${
                        isOwn
                          ? 'bg-primary text-primary-foreground rounded-br-sm'
                          : 'bg-background border border-border rounded-bl-sm'
                      }`}
                    >
                      <p className="text-sm leading-relaxed break-words">{message.message}</p>
                      <p className={`text-xs mt-1.5 ${isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                        {new Date(message.timestamp).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </CardContent>

        {/* Message Input */}
        <div className="border-t bg-background px-6 py-4">
          <div className="flex space-x-3">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              disabled={sending}
              className="flex-1 bg-muted/50 border-border/50 focus:bg-background transition-colors"
            />
            <Button
              onClick={sendMessage}
              disabled={sending || !newMessage.trim()}
              size="icon"
              className="shadow-elegant hover:shadow-glow transition-shadow"
            >
              {sending ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></div>
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}