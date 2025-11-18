import React, { useState, useRef, useEffect } from 'react';

interface MessageInputProps {
  onSend: (message: string) => void;
  onTypingStart?: () => void;
  onTypingStop?: () => void;
  disabled?: boolean;
  placeholder?: string;
  insertText?: string; // Text to insert into input
  onInsertTextHandled?: () => void; // Callback when text is inserted
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSend,
  onTypingStart,
  onTypingStop,
  disabled = false,
  placeholder = 'Nhập tin nhắn...',
  insertText,
  onInsertTextHandled,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Handle insertText prop - use a ref to track previous value
  const prevInsertTextRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    // Only insert if insertText changed and is not empty
    if (insertText && insertText.trim() && insertText !== prevInsertTextRef.current) {
      prevInsertTextRef.current = insertText;
      setInputValue((prev) => {
        // Append to existing text, or replace if empty
        const newValue = prev.trim() ? `${prev} ${insertText}` : insertText;
        // Focus textarea after a short delay to ensure state is updated
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.focus();
            // Move cursor to end
            const length = newValue.length;
            textareaRef.current.setSelectionRange(length, length);
          }
        }, 0);
        return newValue;
      });
      // Notify parent that text was inserted
      if (onInsertTextHandled) {
        onInsertTextHandled();
      }
    }
  }, [insertText, onInsertTextHandled]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [inputValue]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);

    // Typing indicator
    if (!isTyping && e.target.value.trim()) {
      setIsTyping(true);
      if (onTypingStart) {
        onTypingStart();
      }
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      if (onTypingStop) {
        onTypingStop();
      }
    }, 1000);
  };

  const handleSend = () => {
    if (!inputValue.trim() || disabled) return;

    onSend(inputValue.trim());
    setInputValue('');
    setIsTyping(false);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (onTypingStop) {
      onTypingStop();
    }

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      style={{
        padding: '16px',
        borderTop: '1px solid #e5e7eb',
        backgroundColor: 'white',
        borderRadius: '0 0 16px 16px',
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: '8px',
          alignItems: 'flex-end',
        }}
      >
        <textarea
          ref={textareaRef}
          value={inputValue}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          disabled={disabled}
          style={{
            flex: 1,
            padding: '12px',
            border: '1px solid #d1d5db',
            borderRadius: '12px',
            fontSize: '14px',
            resize: 'none',
            minHeight: '44px',
            maxHeight: '120px',
            outline: 'none',
            fontFamily: 'inherit',
            backgroundColor: disabled ? '#f3f4f6' : 'white',
            cursor: disabled ? 'not-allowed' : 'text',
          }}
          rows={1}
        />
        <button
          onClick={handleSend}
          disabled={!inputValue.trim() || disabled}
          style={{
            padding: '12px',
            background:
              inputValue.trim() && !disabled
                ? 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)'
                : '#d1d5db',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            cursor: inputValue.trim() && !disabled ? 'pointer' : 'not-allowed',
            fontSize: '16px',
            minWidth: '44px',
            height: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            if (inputValue.trim() && !disabled) {
              e.currentTarget.style.transform = 'scale(1.05)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          ➤
        </button>
      </div>
    </div>
  );
};

