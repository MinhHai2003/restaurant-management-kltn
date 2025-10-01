import React, { useState } from 'react';
import ChatBot from './ChatBot';
import ChatButton from './ChatButton';
import { useCart } from '../../contexts/CartContext';

const ChatBotContainer: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { updateCartCount } = useCart();

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const closeChat = () => {
    setIsOpen(false);
  };

  return (
    <>
      <ChatBot isOpen={isOpen} onClose={closeChat} onCartUpdate={updateCartCount} />
      <ChatButton isOpen={isOpen} onClick={toggleChat} />
    </>
  );
};

export default ChatBotContainer;