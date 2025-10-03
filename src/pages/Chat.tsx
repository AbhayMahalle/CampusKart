import { useSearchParams } from 'react-router-dom';
import ChatList from '@/pages/ChatList';
import ChatWindow from '@/pages/ChatWindow';

export default function Chat() {
  const [searchParams] = useSearchParams();
  const receiverId = searchParams.get('receiver');
  const productId = searchParams.get('product');
  
  // If receiver and product params exist, show chat window
  if (receiverId && productId) {
    return <ChatWindow />;
  }
  
  // Otherwise show chat list
  return <ChatList />;
}