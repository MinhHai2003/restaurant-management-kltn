import React, { useState } from 'react';
import ChatBot from './ChatBot';
import ChatButton from './ChatButton';

const ChatBotContainer: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const closeChat = () => {
    setIsOpen(false);
  };

  return (
    <>
      <ChatBot isOpen={isOpen} onClose={closeChat} />
      <ChatButton isOpen={isOpen} onClick={toggleChat} />
    </>
  );
};

export default ChatBotContainer;