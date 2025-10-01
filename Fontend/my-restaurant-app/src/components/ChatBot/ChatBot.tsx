import React, { useState, useRef, useEffect } from 'react';
import { processQuestion } from '../../services/aiService';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  isTyping?: boolean;
}

interface ChatBotProps {
  isOpen: boolean;
  onClose: () => void;
  onCartUpdate?: () => void;
}

const ChatBot: React.FC<ChatBotProps> = ({ isOpen, onClose, onCartUpdate }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: '👋 **Xin chào! Tôi là AI Assistant**\n\n🤖 Tôi có thể giúp bạn:\n• 🍽️ **Tư vấn nhà hàng**: Menu, giá cả, đặt bàn\n• 🧮Hỏi tôi bất cứ điều gì! 🚀**',
      sender: 'bot',
      timestamp: new Date(),
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Advanced AI Response Generator - ChatGPT like
  const getAIResponse = (message: string): string => {
    const lowerMessage = message.toLowerCase();

    // Math calculations
    if (/[\d+\-*/()^√%.,\s]+/.test(message) && /[+\-*/^√%]/.test(message)) {
      const result = calculateAdvancedMath(message);
      if (result !== null) {
        return `🧮 **Kết quả tính toán:**\n\n${message} = **${result}**\n\nBạn có phép tính nào khác không?`;
      }
    }

    // Programming questions
    if (lowerMessage.includes('python') || lowerMessage.includes('javascript') || lowerMessage.includes('react') || lowerMessage.includes('code') || lowerMessage.includes('lập trình')) {
      return getProgrammingResponse(lowerMessage);
    }

    // Science questions
    if (lowerMessage.includes('ai') || lowerMessage.includes('trí tuệ nhân tạo') || lowerMessage.includes('machine learning')) {
      return `🤖 **Trí tuệ nhân tạo (AI)**

AI là công nghệ mô phỏng trí thông minh con người:

🧠 **Các loại AI:**
• **Narrow AI**: Chuyên về 1 lĩnh vực (Siri, ChatGPT)
• **General AI**: Thông minh toàn diện (chưa tồn tại)
• **Super AI**: Vượt trội con người (tương lai)

⚡ **Ứng dụng:**
• Nhận diện hình ảnh, giọng nói
• Xử lý ngôn ngữ tự nhiên
• Xe tự lái, robot thông minh
• Chẩn đoán y tế, dự báo

🔮 **Tương lai**: AI sẽ thay đổi mọi ngành nghề!`;
    }

    if (lowerMessage.includes('vũ trụ') || lowerMessage.includes('không gian') || lowerMessage.includes('thiên hà')) {
      return `🌌 **Vũ trụ - Không gian vô tận**

🎯 **Sự thật thú vị:**
• Tuổi: **13.8 tỷ năm**
• Kích thước: **Vô hạn** (đang giãn nở)
• Thiên hà: **2+ nghìn tỷ** thiên hà
• Sao: **10^24** ngôi sao (nhiều hơn cát trên Trái Đất)

🪐 **Hệ Mặt Trời:**
• 8 hành tinh, hàng trăm mặt trăng
• Trái Đất: Hành tinh duy nhất có sự sống

🚀 **Khám phá**: James Webb, Hubble đang mở ra bí ẩn vũ trụ!`;
    }

    if (lowerMessage.includes('einstein') || lowerMessage.includes('newton') || lowerMessage.includes('vật lý')) {
      return `⚛️ **Vật lý - Khoa học về vũ trụ**

🧠 **Einstein (1879-1955):**
• **E=mc²**: Năng lượng = khối lượng × c²
• **Thuyết tương đối**: Thời gian, không gian uốn cong
• **Nobel 1921**: Hiệu ứng quang điện

🍎 **Newton (1643-1727):**
• **F=ma**: Lực = khối lượng × gia tốc
• **Vạn vật hấp dẫn**: Táo rơi, Trái Đất quay
• **3 định luật chuyển động**

🔬 **Vật lý hiện đại**: Cơ học lượng tử, hạt cơ bản, năng lượng tối!`;
    }

    // Technology
    if (lowerMessage.includes('blockchain') || lowerMessage.includes('bitcoin') || lowerMessage.includes('crypto')) {
      return `⛓️ **Blockchain & Cryptocurrency**

🔐 **Blockchain là gì?**
• Chuỗi khối dữ liệu **bất biến**
• **Phi tập trung**: Không cần ngân hàng
• **Minh bạch**: Mọi giao dịch công khai
• **Bảo mật**: Mã hóa mạnh mẽ

₿ **Bitcoin (2009):**
• Tiền điện tử đầu tiên
• Tối đa **21 triệu** coin
• **Mining**: Đào coin bằng máy tính
• Tạo bởi **Satoshi Nakamoto** (bí ẩn)

🚀 **Ứng dụng**: DeFi, NFT, Web3, hợp đồng thông minh!`;
    }

    // Health & Science
    if (lowerMessage.includes('sức khỏe') || lowerMessage.includes('covid') || lowerMessage.includes('virus') || lowerMessage.includes('dna')) {
      return `🧬 **Khoa học sức khỏe**

💪 **Sống khỏe mỗi ngày:**
• **Nước**: 2-3 lít/ngày 💧
• **Ngủ**: 7-8 tiếng/đêm 😴
• **Vận động**: 30 phút/ngày 🏃‍♂️
• **Ăn**: Nhiều rau xanh, ít đường 🥗
• **Tinh thần**: Thiền, yoga, đọc sách 🧘‍♀️

🧬 **DNA - Bản thiết kế sự sống:**
• 3 tỷ cặp base A-T, G-C
• 99.9% giống nhau giữa con người
• Chứa toàn bộ thông tin di truyền

🦠 **Virus**: Ký sinh bắt buộc, cần tế bào chủ để sinh sôi!`;
    }

    // Time and date
    if (lowerMessage.includes('ngày') || lowerMessage.includes('hôm nay') || lowerMessage.includes('thời gian')) {
      const now = new Date();
      const weekday = now.toLocaleDateString('vi-VN', { weekday: 'long' });
      const date = now.toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric' });
      const time = now.toLocaleTimeString('vi-VN');

      return `⏰ **Thời gian hiện tại:**\n\n📅 **${weekday}**, ${date}\n🕐 **${time}**\n\nBạn có kế hoạch gì thú vị hôm nay không?`;
    }

    // Temperature conversion
    const tempCMatch = message.match(/(\d+)\s*độ?\s*c/i);
    if (tempCMatch) {
      const celsius = parseFloat(tempCMatch[1]);
      const fahrenheit = (celsius * 9 / 5) + 32;
      const kelvin = celsius + 273.15;

      return `🌡️ **Chuyển đổi nhiệt độ:**\n\n**${celsius}°C** =\n• **${fahrenheit.toFixed(1)}°F** (Fahrenheit)\n• **${kelvin.toFixed(1)}K** (Kelvin)\n\n💡 *Nước đóng băng ở 0°C = 32°F = 273.15K*`;
    }

    const tempFMatch = message.match(/(\d+)\s*độ?\s*f/i);
    if (tempFMatch) {
      const fahrenheit = parseFloat(tempFMatch[1]);
      const celsius = (fahrenheit - 32) * 5 / 9;
      const kelvin = celsius + 273.15;

      return `🌡️ **Chuyển đổi nhiệt độ:**\n\n**${fahrenheit}°F** =\n• **${celsius.toFixed(1)}°C** (Celsius)\n• **${kelvin.toFixed(1)}K** (Kelvin)`;
    }

    // Currency conversion
    const usdMatch = message.match(/(\d+(?:\.\d+)?)\s*(?:usd|\$|đô)/i);
    if (usdMatch) {
      const usd = parseFloat(usdMatch[1]);
      const vnd = usd * 24000;

      return `💰 **Chuyển đổi tiền tệ:**\n\n**${usd} USD** ≈ **${vnd.toLocaleString('vi-VN')} VNĐ**\n\n💡 *Tỷ giá ước lượng, có thể thay đổi theo thời gian*`;
    }

    // Restaurant questions
    if (lowerMessage.includes('món ăn') || lowerMessage.includes('nhà hàng') || lowerMessage.includes('menu') || lowerMessage.includes('đặt bàn')) {
      return getRestaurantResponse(lowerMessage);
    }

    // Greetings
    if (lowerMessage.includes('chào') || lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
      return `👋 **Chào bạn!** Tôi rất vui được trò chuyện!\n\n🤖 Tôi là AI Assistant có thể:\n• Trả lời **mọi câu hỏi** như ChatGPT\n• Giải **toán phức tạp**\n• Chia sẻ **kiến thức** về khoa học, công nghệ\n• Tư vấn về **nhà hàng**\n\n**Hãy hỏi tôi bất cứ điều gì bạn tò mò! 🚀**`;
    }

    // Thanks
    if (lowerMessage.includes('cảm ơn') || lowerMessage.includes('thank')) {
      return `🙏 **Rất vui được giúp bạn!**\n\nNếu có thêm câu hỏi nào khác - dù là toán học, khoa học, công nghệ, hay bất cứ điều gì - đừng ngại hỏi tôi nhé!\n\n✨ *Tôi luôn sẵn sàng học hỏi và chia sẻ!*`;
    }

    // Default intelligent responses
    const smartResponses = [
      `🤔 **Câu hỏi thú vị!** Tôi có thể giúp bạn về:\n\n🧮 **Toán học**: Từ cơ bản đến phức tạp\n🔬 **Khoa học**: Vật lý, hóa học, sinh học\n💻 **Công nghệ**: AI, lập trình, blockchain\n🌍 **Kiến thức**: Lịch sử, địa lý, văn hóa\n🍽️ **Nhà hàng**: Menu, đặt bàn, tư vấn\n\n**Bạn muốn tìm hiểu về chủ đề nào?**`,

      `💡 **Tôi sẵn sàng trả lời!** Một số điều tôi giỏi:\n\n• **Giải thích khái niệm** phức tạp một cách đơn giản\n• **Tính toán** nhanh và chính xác\n• **Chia sẻ kiến thức** từ nhiều lĩnh vực\n• **Trò chuyện** tự nhiên như bạn bè\n\n**Hỏi tôi bất cứ điều gì - từ "2+2" đến "vũ trụ hoạt động thế nào?"! 🌟**`,

      `🎯 **Đó là điều thú vị để khám phá!**\n\nTôi được thiết kế để:\n• **Hiểu** câu hỏi phức tạp\n• **Phân tích** và đưa ra câu trả lời chính xác\n• **Học hỏi** từ mỗi cuộc trò chuyện\n• **Hỗ trợ** mọi chủ đề bạn quan tâm\n\n**Thử thách tôi với câu hỏi khó nhất của bạn! 🚀**`
    ];

    return smartResponses[Math.floor(Math.random() * smartResponses.length)];
  };

  // Advanced math calculator
  const calculateAdvancedMath = (expression: string): string | null => {
    try {
      let expr = expression
        .replace(/\s/g, '')
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/,/g, '.')
        .replace(/√(\d+)/g, 'Math.sqrt($1)')
        .replace(/(\d+)\^(\d+)/g, 'Math.pow($1,$2)')
        .replace(/π/g, 'Math.PI')
        .replace(/sin\(([^)]+)\)/g, 'Math.sin($1)')
        .replace(/cos\(([^)]+)\)/g, 'Math.cos($1)')
        .replace(/tan\(([^)]+)\)/g, 'Math.tan($1)')
        .replace(/log\(([^)]+)\)/g, 'Math.log10($1)')
        .replace(/ln\(([^)]+)\)/g, 'Math.log($1)');

      // Validate expression
      if (!/^[0-9+\-*/().\s,Math.sqrt(),Math.pow(),Math.PI,Math.sin(),Math.cos(),Math.tan(),Math.log10(),Math.log()]+$/.test(expr)) {
        return null;
      }

      const result = Function(`"use strict"; return (${expr})`)();

      if (typeof result === 'number' && !isNaN(result)) {
        return result.toFixed(6).replace(/\.?0+$/, '');
      }
      return null;
    } catch {
      return null;
    }
  };

  // Programming responses
  const getProgrammingResponse = (message: string): string => {
    if (message.includes('python')) {
      return `🐍 **Python - Ngôn ngữ lập trình mạnh mẽ**

🚀 **Tại sao chọn Python?**
• **Dễ học**: Cú pháp đơn giản như tiếng Anh
• **Đa năng**: Web, AI, Data Science, Game
• **Thư viện phong phú**: NumPy, Pandas, Django
• **Cộng đồng lớn**: Hỗ trợ tốt

💻 **Ứng dụng:**
• **AI/ML**: TensorFlow, PyTorch
• **Web**: Django, Flask, FastAPI  
• **Data**: Pandas, Matplotlib
• **Automation**: Selenium, BeautifulSoup

\`\`\`python
# Hello World
print("Hello, World!")

# Function
def greet(name):
    return f"Hello {name}!"
\`\`\``;
    }

    if (message.includes('javascript') || message.includes('js')) {
      return `⚡ **JavaScript - Ngôn ngữ của Web**

🌐 **Sức mạnh JavaScript:**
• **Frontend**: React, Vue, Angular
• **Backend**: Node.js, Express
• **Mobile**: React Native, Ionic
• **Desktop**: Electron

🔥 **ES6+ Features:**
• Arrow functions, async/await
• Destructuring, modules
• Classes, template literals

\`\`\`javascript
// Modern JavaScript
const greet = (name) => \`Hello \${name}!\`;

// Async function
async function fetchData() {
    const response = await fetch('/api/data');
    return response.json();
}
\`\`\`

💡 **Tip**: JavaScript chạy trên 99% website!`;
    }

    if (message.includes('react')) {
      return `⚛️ **React - Thư viện UI mạnh mẽ**

🎯 **React đặc biệt vì:**
• **Component-based**: Tái sử dụng code
• **Virtual DOM**: Hiệu suất cao
• **JSX**: HTML trong JavaScript  
• **Hooks**: State management hiện đại

🛠️ **Ecosystem:**
• **Routing**: React Router
• **State**: Redux, Zustand
• **Styling**: Styled Components, Tailwind
• **Forms**: Formik, React Hook Form

\`\`\`jsx
// React Component
function Welcome({ name }) {
    const [count, setCount] = useState(0);
    
    return (
        <div>
            <h1>Hello {name}!</h1>
            <button onClick={() => setCount(count + 1)}>
                Count: {count}
            </button>
        </div>
    );
}
\`\`\``;
    }

    return `💻 **Lập trình - Nghệ thuật tạo ra phần mềm**

🎯 **Ngôn ngữ phổ biến:**
• **Python**: AI, Data Science
• **JavaScript**: Web Development
• **Java**: Enterprise Apps
• **C++**: Game, System Programming
• **Go**: Backend, Microservices

🚀 **Bắt đầu lập trình:**
1. **Chọn ngôn ngữ** phù hợp mục tiêu
2. **Học cú pháp** cơ bản
3. **Thực hành** với project nhỏ
4. **Tham gia** cộng đồng

**Bạn muốn học ngôn ngữ nào?**`;
  };

  // Restaurant responses
  const getRestaurantResponse = (message: string): string => {
    if (message.includes('menu') || message.includes('món ăn')) {
      return `🍽️ **Menu Nhà Hàng Hải Sản Biển Đông**

🦐 **Hải sản tươi sống:**
• Tôm hùm nướng phô mai - **450.000đ**
• Cua hoàng đế hấp bia - **380.000đ**
• Mực nướng sa tế - **280.000đ**

🍲 **Món chính:**
• Phở bò đặc biệt - **75.000đ**
• Lẩu thái hải sản - **320.000đ**
• Cơm tấm sườn nướng - **70.000đ**

🥗 **Khai vị:**
• Gỏi cuốn tôm thịt - **45.000đ**
• Chả cá Lã Vọng - **85.000đ**

**Món nào bạn quan tâm nhất?**`;
    }

    if (message.includes('đặt bàn') || message.includes('book')) {
      return `📞 **Đặt bàn dễ dàng**

🔥 **Hotline**: **0936.253.588**
⏰ **Giờ nhận đặt**: 6:00 - 21:30
📱 **Zalo**: 0936253588

💡 **Lưu ý:**
• Đặt trước **30 phút** cho bàn thường
• Cuối tuần đặt trước **2-3 tiếng**
• Nhóm >10 người đặt trước **1 ngày**
• **Miễn phí** hủy đặt trước 1 tiếng

🎉 **Ưu đãi đặt bàn:**
• Nhóm >10 người: **Giảm 10%**
• Sinh nhật: **Tặng bánh sinh nhật**`;
    }

    return `🏮 **Nhà Hàng Hải Sản Biển Đông**

📍 **Địa chỉ**: 123 Đường Hải Sản, Quận Biển Đông, TP.HCM
📞 **Hotline**: 0936.253.588
⏰ **Giờ mở cửa**: 6:00 - 22:00 (7 ngày/tuần)

🌟 **Đặc sản nổi tiếng:**
• Hải sản tươi sống hàng ngày
• Phở bò nước dùng hầm 12 tiếng
• Lẩu thái công thức độc quyền

🚗 **Tiện ích**: Bãi đậu xe miễn phí, giao hàng tận nơi`;
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputValue;
    setInputValue('');
    setIsTyping(true);

    try {
      const botResponse = await processQuestion(currentInput);
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: botResponse,
        sender: 'bot',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
      
      // Check if response indicates successful cart addition or removal
      if (
        (botResponse.includes('✅ Đã thêm') && botResponse.includes('vào giỏ hàng')) ||
        (botResponse.includes('✅ Đã xóa') && botResponse.includes('khỏi giỏ hàng')) ||
        (botResponse.includes('✅ Đã giảm')) ||
        (botResponse.includes('✅ Đã xóa toàn bộ giỏ hàng'))
      ) {
        // Update cart count in header
        if (onCartUpdate) {
          onCartUpdate();
        }
      }
    } catch (error) {
      console.error('Error processing question:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Xin lỗi, có lỗi xảy ra. Vui lòng thử lại.',
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '100px',
      right: '20px',
      width: '380px',
      height: '500px',
      background: 'white',
      borderRadius: '16px',
      boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 1000,
      border: '1px solid #e5e7eb'
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)',
        color: 'white',
        padding: '16px',
        borderRadius: '16px 16px 0 0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px'
          }}>
            🤖
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>
              Trợ Lý Ảo
            </h3>
            <p style={{ margin: 0, fontSize: '12px', opacity: 0.9 }}>
              Tư vấn món ăn ngon
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            fontSize: '18px',
            cursor: 'pointer',
            padding: '4px'
          }}
        >
          ✕
        </button>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        padding: '16px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        {messages.map((message) => (
          <div
            key={message.id}
            style={{
              display: 'flex',
              justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start'
            }}
          >
            <div style={{
              maxWidth: '80%',
              padding: '12px 16px',
              borderRadius: message.sender === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
              background: message.sender === 'user'
                ? 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)'
                : '#f3f4f6',
              color: message.sender === 'user' ? 'white' : '#374151',
              fontSize: '14px',
              lineHeight: '1.4',
              whiteSpace: 'pre-wrap'
            }}>
              {message.text}
            </div>
          </div>
        ))}

        {isTyping && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{
              padding: '12px 16px',
              borderRadius: '16px 16px 16px 4px',
              background: '#f3f4f6',
              color: '#374151',
              fontSize: '14px'
            }}>
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <span>Đang trả lời</span>
                <div style={{
                  display: 'flex',
                  gap: '2px'
                }}>
                  <div style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: '#6b7280',
                    animation: 'pulse 1.5s ease-in-out infinite'
                  }}></div>
                  <div style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: '#6b7280',
                    animation: 'pulse 1.5s ease-in-out infinite 0.2s'
                  }}></div>
                  <div style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: '#6b7280',
                    animation: 'pulse 1.5s ease-in-out infinite 0.4s'
                  }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: '16px',
        borderTop: '1px solid #e5e7eb',
        borderRadius: '0 0 16px 16px'
      }}>
        <div style={{
          display: 'flex',
          gap: '8px',
          alignItems: 'flex-end'
        }}>
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Hỏi tôi về món ăn ngon..."
            style={{
              flex: 1,
              padding: '12px',
              border: '1px solid #d1d5db',
              borderRadius: '12px',
              fontSize: '14px',
              resize: 'none',
              minHeight: '44px',
              maxHeight: '80px',
              outline: 'none',
              fontFamily: 'inherit'
            }}
            rows={1}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isTyping}
            style={{
              padding: '12px',
              background: inputValue.trim() && !isTyping
                ? 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)'
                : '#d1d5db',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              cursor: inputValue.trim() && !isTyping ? 'pointer' : 'not-allowed',
              fontSize: '16px',
              minWidth: '44px',
              height: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ➤
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatBot;