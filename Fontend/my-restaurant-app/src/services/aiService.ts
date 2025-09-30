export interface AIResponse {
  text: string;
  confidence?: number;
  source?: 'groq' | 'openai' | 'cohere' | 'huggingface' | 'local';
}

// Free AI APIs that actually work
const FREE_AI_APIS = [
  {
    name: 'groq',
    url: 'https://api.groq.com/openai/v1/chat/completions',
    model: 'llama3-8b-8192',
    key: 'VITE_GROQ_API_KEY'
  },
  {
    name: 'cohere',
    url: 'https://api.cohere.ai/v1/generate',
    model: 'command-light',
    key: 'VITE_COHERE_API_KEY'
  },
  {
    name: 'openai',
    url: 'https://api.openai.com/v1/chat/completions',
    model: 'gpt-3.5-turbo',
    key: 'VITE_OPENAI_API_KEY'
  }
];

export async function processQuestion(question: string): Promise<string> {
  console.log('🤖 Processing question:', question);
  
  // Try free APIs first
  const apiResponse = await tryFreeAPIs(question);
  if (apiResponse) {
    return apiResponse;
  }
  
  // Enhanced local AI as ultimate fallback
  return getEnhancedLocalAI(question);
}

async function tryFreeAPIs(question: string): Promise<string | null> {
  // Try each API in order
  for (const api of FREE_AI_APIS) {
    const apiKey = import.meta.env[api.key];
    if (!apiKey) {
      console.log(`${api.name} API key not found, skipping...`);
      continue;
    }

    try {
      let response: string | null = null;
      
      switch (api.name) {
        case 'groq':
          response = await callGroqAPI(question, apiKey);
          break;
        case 'cohere':
          response = await callCohereAPI(question, apiKey);
          break;
        case 'openai':
          response = await callOpenAI(question, apiKey);
          break;
      }

      if (response) {
        console.log(`✅ ${api.name} API responded successfully`);
        return response;
      }
    } catch (error) {
      console.log(`❌ ${api.name} API failed:`, error);
    }
  }

  return null;
}

async function callGroqAPI(question: string, apiKey: string): Promise<string | null> {
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192',
        messages: [
          {
            role: 'system',
            content: `Bạn là trợ lý AI thông minh của Nhà Hàng Hải Sản Biển Đông. 

Thông tin nhà hàng:
- Tên: Nhà Hàng Hải Sản Biển Đông  
- Địa chỉ: 123 Đường Hải Sản, Quận Biển Đông, TP.HCM
- Hotline: 0936.253.588
- Giờ mở: 6:00-22:00 hàng ngày
- Đặc sản: Hải sản tươi sống

Hãy trả lời thân thiện, hữu ích và sử dụng emoji phù hợp.`
          },
          {
            role: 'user',
            content: question
          }
        ],
        max_tokens: 300,
        temperature: 0.7
      })
    });

    if (response.ok) {
      const data = await response.json();
      return data.choices[0]?.message?.content?.trim() || null;
    }
  } catch (error) {
    console.error('Groq API Error:', error);
  }
  return null;
}

async function callCohereAPI(question: string, apiKey: string): Promise<string | null> {
  try {
    const response = await fetch('https://api.cohere.ai/v1/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'command-light',
        prompt: `Bạn là trợ lý AI của nhà hàng Hải Sản Biển Đông. Câu hỏi: ${question}\nTrả lời:`,
        max_tokens: 200,
        temperature: 0.7,
        stop_sequences: ['\n\n']
      })
    });

    if (response.ok) {
      const data = await response.json();
      return data.generations[0]?.text?.trim() || null;
    }
  } catch (error) {
    console.error('Cohere API Error:', error);
  }
  return null;
}

async function callOpenAI(question: string, apiKey: string): Promise<string | null> {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'Bạn là trợ lý AI của Nhà Hàng Hải Sản Biển Đông. Trả lời thân thiện và hữu ích.'
          },
          {
            role: 'user',
            content: question
          }
        ],
        max_tokens: 300,
        temperature: 0.7
      })
    });

    if (response.ok) {
      const data = await response.json();
      return data.choices[0]?.message?.content?.trim() || null;
    }
  } catch (error) {
    console.error('OpenAI API Error:', error);
  }
  return null;
}

// Local AI response as fallback when external API fails
function getLocalAIResponse(question: string): string {
  const lowerQuestion = question.toLowerCase();

  // Restaurant-specific responses
  if (lowerQuestion.includes('menu') || lowerQuestion.includes('món ăn')) {
    return `🍽️ **Menu Nhà Hàng Hải Sản Biển Đông**

🦐 **Hải sản tươi sống:**
• Tôm hùm nướng phô mai - 450.000đ
• Cua hoàng đế hấp bia - 380.000đ
• Mực nướng sa tế - 280.000đ

🍲 **Món chính:**
• Phở bò đặc biệt - 75.000đ
• Lẩu thái hải sản - 320.000đ
• Cơm tấm sườn nướng - 70.000đ

🥗 **Khai vị:**
• Gỏi cuốn tôm thịt - 45.000đ
• Chả cá Lã Vọng - 85.000đ

**Món nào bạn quan tâm nhất?**`;
  }

  if (lowerQuestion.includes('đặt bàn') || lowerQuestion.includes('reservation')) {
    return `📞 **Đặt bàn dễ dàng**

🔥 **Hotline**: 0936.253.588
⏰ **Giờ nhận đặt**: 6:00 - 21:30

💡 **Lưu ý:**
• Đặt trước 30 phút cho bàn thường
• Cuối tuần đặt trước 2-3 tiếng
• Nhóm >10 người đặt trước 1 ngày

🎉 **Ưu đãi:** Nhóm >10 người giảm 10%`;
  }

  if (lowerQuestion.includes('địa chỉ') || lowerQuestion.includes('ở đâu')) {
    return `📍 **Thông tin nhà hàng**

🏠 **Địa chỉ**: 123 Đường Hải Sản, Quận Biển Đông, TP.HCM
📞 **Điện thoại**: 0936.253.588
⏰ **Giờ mở cửa**: 6:00 - 22:00 (7 ngày/tuần)

🚗 **Tiện ích**: Bãi đậu xe miễn phí, giao hàng tận nơi`;
  }

  // General AI responses
  if (lowerQuestion.includes('chào') || lowerQuestion.includes('hello') || lowerQuestion.includes('hi')) {
    return `👋 **Chào bạn!** Tôi là trợ lý AI của nhà hàng Hải Sản Biển Đông.

🤖 Tôi có thể giúp bạn:
• 🍽️ Tư vấn món ăn và menu
• 💰 Thông tin giá cả
• 📍 Hướng dẫn địa chỉ
• ⏰ Giờ mở cửa và đặt bàn
• 🎯 Gợi ý món đặc biệt

**Bạn muốn tìm hiểu điều gì?**`;
  }

  if (lowerQuestion.includes('cảm ơn') || lowerQuestion.includes('thank')) {
    return `🙏 **Rất vui được giúp bạn!**

Nếu có thêm câu hỏi nào về nhà hàng, món ăn, hay muốn đặt bàn, đừng ngại hỏi tôi nhé!

🍽️ Chúc bạn có những bữa ăn ngon miệng tại Hải Sản Biển Đông!`;
  }

  // Math calculations
  const mathMatch = question.match(/[\d+\-*/()^√%.,\s]+/);
  if (mathMatch && /[+\-*/^√%]/.test(question)) {
    try {
      let expr = question.replace(/\s/g, '').replace(/×/g, '*').replace(/÷/g, '/');
      expr = expr.replace(/√(\d+)/g, 'Math.sqrt($1)');
      expr = expr.replace(/(\d+)\^(\d+)/g, 'Math.pow($1,$2)');

      const result = Function(`"use strict"; return (${expr})`)();
      if (typeof result === 'number' && !isNaN(result)) {
        return `🧮 **Kết quả**: ${question} = **${result.toFixed(2)}**`;
      }
    } catch {
      // Continue to general response
    }
  }

  // Default intelligent responses
  const responses = [
    `🤔 **Câu hỏi thú vị!** Tôi có thể giúp bạn về:

🍽️ **Nhà hàng:**
• Menu và giá cả
• Đặt bàn, địa chỉ
• Giờ mở cửa, đặc sản

🧮 **Khác:**
• Tính toán cơ bản
• Tư vấn, hỗ trợ

**Bạn muốn hỏi về chủ đề nào?**`,

    `💡 **Tôi sẵn sàng hỗ trợ!**

Hiện tại tôi có thể tư vấn về:
• 🍽️ **Menu**: Món ăn, giá cả, gợi ý
• 📞 **Đặt bàn**: Hotline, giờ nhận đặt
• 📍 **Thông tin**: Địa chỉ, tiện ích
• 🧮 **Tính toán**: Phép tính đơn giản

**Bạn cần hỗ trợ gì cụ thể?**`,

    `🎯 **Hãy cho tôi biết bạn cần gì!**

Tôi là trợ lý của nhà hàng Hải Sản Biển Đông, có thể:
• Tư vấn **món ăn ngon**
• Hỗ trợ **đặt bàn**
• Cung cấp **thông tin nhà hàng**
• **Tính toán** nhanh

**Hỏi tôi bất cứ điều gì nhé! 🚀**`
  ];

  return responses[Math.floor(Math.random() * responses.length)];
}
