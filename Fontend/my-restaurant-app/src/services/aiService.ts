export interface AIResponse {
  text: string;
  confidence?: number;
  source?: 'groq' | 'openai' | 'cohere' | 'huggingface' | 'local';
}

interface RestaurantData {
  menu: MenuItem[];
  tables: Table[];
  availability: {
    menuItems: string[];
    availableTables: number;
  };
}

interface MenuItem {
  _id: string;
  name: string;
  price: number;
  description?: string;
  category?: string;
  available: boolean;
  image?: string;
  hasImage?: boolean;
  imageUrl?: string;
}

interface Table {
  _id: string;
  tableNumber: string;
  capacity: number;
  location: string;
  status: string;
  zone?: string;
  features?: string[];
  isActive: boolean;
}

// Free AI APIs that actually work
const FREE_AI_APIS = [
  {
    name: 'groq',
    url: 'https://api.groq.com/openai/v1/chat/completions',
    model: 'llama-3.1-8b-instant',
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

// Helper function to fetch all tables (handle pagination)
async function fetchAllTables(): Promise<Table[]> {
  try {
    console.log('🔍 Fetching all tables with pagination handling...');
    
    // First, get the first page to know total pages
    const firstPageResponse = await fetch('http://localhost:5006/api/tables?page=1&limit=10');
    if (!firstPageResponse.ok) {
      console.error('❌ Failed to fetch first page of tables');
      return [];
    }
    
    const firstPageData = await firstPageResponse.json();
    console.log('📄 First page data:', firstPageData);
    
    if (!firstPageData.success || !firstPageData.data) {
      return [];
    }
    
    let allTables: Table[] = [...firstPageData.data.tables];
    const pagination = firstPageData.data.pagination;
    
    console.log(`📊 Pagination info: ${pagination.current}/${pagination.pages} pages, total: ${pagination.total}`);
    
    // If there are more pages, fetch them
    if (pagination.pages > 1) {
      for (let page = 2; page <= pagination.pages; page++) {
        const pageResponse = await fetch(`http://localhost:5006/api/tables?page=${page}&limit=10`);
        if (pageResponse.ok) {
          const pageData = await pageResponse.json();
          if (pageData.success && pageData.data.tables) {
            allTables = [...allTables, ...pageData.data.tables];
          }
        }
      }
    }
    
    console.log(`✅ Fetched total ${allTables.length} tables from ${pagination.pages} pages`);
    return allTables;
    
  } catch (error) {
    console.error('❌ Error fetching all tables:', error);
    return [];
  }
}
async function testAPIEndpoint(url: string, name: string): Promise<unknown> {
  try {
    console.log(`🔍 Testing ${name} API: ${url}`);
    const response = await fetch(url);
    
    if (!response.ok) {
      console.log(`❌ ${name} API returned status: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    console.log(`✅ ${name} API response structure:`, typeof data, Array.isArray(data) ? 'Array' : 'Object');
    
    // Special debug for table API
    if (name === 'Table' && data && typeof data === 'object') {
      console.log(`🔍 ${name} API full response:`, JSON.stringify(data, null, 2));
    }
    
    return data;
  } catch (error) {
    console.error(`❌ ${name} API error:`, error);
    return null;
  }
}

// Step 2: Fetch real data from database
async function fetchRestaurantData(): Promise<RestaurantData> {
  try {
    console.log('📊 Fetching restaurant data from database...');
    
    // Test and fetch menu data
    const rawMenuData = await testAPIEndpoint('http://localhost:5003/api/menu', 'Menu');
    let menuData: MenuItem[] = [];
    if (rawMenuData && Array.isArray(rawMenuData)) {
      menuData = rawMenuData;
    }
    
    // Test and fetch table data (với pagination handling)
    const tableData: Table[] = await fetchAllTables();
    
    console.log('📊 Raw data:', { menuCount: menuData.length, tableCount: tableData.length });
    
    // Debug: Log all table data
    if (Array.isArray(tableData)) {
      console.log('🏢 All tables data:', tableData.map(table => ({
        number: table.tableNumber,
        status: table.status,
        isActive: table.isActive,
        capacity: table.capacity
      })));
    }
    
    // Process availability with correct field names
    const availableMenuItems = Array.isArray(menuData) 
      ? menuData
          .filter((item: MenuItem) => item.available === true)
          .map((item: MenuItem) => `${item.name} - ${item.price.toLocaleString()}đ`)
      : [];
    
    const availableTables = Array.isArray(tableData)
      ? tableData.filter((table: Table) => {
          const isAvailable = table.status === 'available';
          const isActive = table.isActive;
          return isAvailable && isActive;
        }).length
      : 0;
    
    console.log(`📊 Table Summary: Total=${tableData.length}, Available=${availableTables}`);
    console.log(`✅ Processed: ${availableMenuItems.length} available menu items, ${availableTables} available tables`);
    
    return {
      menu: menuData,
      tables: tableData,
      availability: {
        menuItems: availableMenuItems,
        availableTables
      }
    };
  } catch (error) {
    console.error('❌ Failed to fetch restaurant data:', error);
    return {
      menu: [],
      tables: [],
      availability: {
        menuItems: [],
        availableTables: 0
      }
    };
  }
}

export async function processQuestion(question: string): Promise<string> {
  console.log('🤖 Processing question:', question);
  
  // Step 1: Collect user question (already have it)
  
  // Step 2: Fetch real data from database
  const restaurantData = await fetchRestaurantData();
  
  // Step 3: Send question + real data to AI
  const apiResponse = await tryFreeAPIs(question, restaurantData);
  if (apiResponse) {
    return apiResponse;
  }
  
  // Step 4: Fallback to local AI with real data
  return getLocalAIResponse(question, restaurantData);
}

async function tryFreeAPIs(question: string, restaurantData: RestaurantData): Promise<string | null> {
  // Try each API in order
  for (const api of FREE_AI_APIS) {
    const apiKey = import.meta.env[api.key];
    if (!apiKey || apiKey === 'your_cohere_api_key_here' || apiKey === 'your_openai_api_key_here') {
      console.log(`${api.name} API key not found or placeholder, skipping...`);
      continue;
    }

    try {
      let response: string | null = null;
      
      switch (api.name) {
        case 'groq':
          response = await callGroqAPI(question, apiKey, restaurantData);
          break;
        case 'cohere':
          response = await callCohereAPI(question, apiKey, restaurantData);
          break;
        case 'openai':
          response = await callOpenAI(question, apiKey, restaurantData);
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

async function callGroqAPI(question: string, apiKey: string, restaurantData: RestaurantData): Promise<string | null> {
  try {
    // Step 3: Create enhanced prompt with real data
    const menuInfo = restaurantData.availability.menuItems.length > 0 
      ? `MENU ĐẦY ĐỦ (${restaurantData.availability.menuItems.length} món):\n${restaurantData.availability.menuItems.join('\n')}`
      : 'Menu đang cập nhật';
    
    const totalTables = restaurantData.tables.length;
    const availableTables = restaurantData.availability.availableTables;
    const tableInfo = `THÔNG TIN BÀN: ${availableTables}/${totalTables} bàn trống (${Math.round((availableTables/totalTables)*100)}% khả dụng)`;
    
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
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

THÔNG TIN THỜI GIAN THỰC TỪ DATABASE:
${menuInfo}

${tableInfo}

QUAN TRỌNG: 
- Khi hỏi về số lượng món, trả lời chính xác số món có sẵn
- Khi hỏi về bàn, cung cấp thông tin chi tiết về tỷ lệ trống/đã đặt
- Luôn dựa trên dữ liệu thực tế từ database

Hãy trả lời dựa trên thông tin thực tế này, thân thiện và hữu ích với emoji phù hợp.`
          },
          {
            role: 'user',
            content: question
          }
        ],
        max_tokens: 400,
        temperature: 0.7
      })
    });

    if (response.ok) {
      const data = await response.json();
      return data.choices[0]?.message?.content?.trim() || null;
    } else {
      console.error('Groq API Error:', response.status, response.statusText);
      const errorData = await response.text();
      console.error('Error details:', errorData);
    }
  } catch (error) {
    console.error('Groq API Error:', error);
  }
  return null;
}

async function callCohereAPI(question: string, apiKey: string, restaurantData: RestaurantData): Promise<string | null> {
  try {
    const menuInfo = restaurantData.availability.menuItems.length > 0 
      ? `Menu: ${restaurantData.availability.menuItems.slice(0, 5).join(', ')}`
      : 'Menu đang cập nhật';
    
    const response = await fetch('https://api.cohere.ai/v1/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'command-light',
        prompt: `Bạn là trợ lý AI của nhà hàng Hải Sản Biển Đông. ${menuInfo}. Bàn trống: ${restaurantData.availability.availableTables}. Câu hỏi: ${question}\nTrả lời:`,
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

async function callOpenAI(question: string, apiKey: string, restaurantData: RestaurantData): Promise<string | null> {
  try {
    const menuInfo = restaurantData.availability.menuItems.length > 0 
      ? `Menu hiện có: ${restaurantData.availability.menuItems.slice(0, 8).join(', ')}`
      : 'Menu đang cập nhật';
      
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
            content: `Bạn là trợ lý AI của Nhà Hàng Hải Sản Biển Đông. ${menuInfo}. Bàn trống: ${restaurantData.availability.availableTables}. Trả lời thân thiện và hữu ích dựa trên thông tin thực tế.`
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

// Step 4: Local AI response with real data as fallback
function getLocalAIResponse(question: string, restaurantData: RestaurantData): string {
  const lowerQuestion = question.toLowerCase();

  // Restaurant-specific responses with REAL DATA
  if (lowerQuestion.includes('menu') || lowerQuestion.includes('món ăn') || lowerQuestion.includes('bao nhiêu món')) {
    const menuItems = restaurantData.availability.menuItems;
    if (menuItems.length > 0) {
      return `🍽️ **Menu Nhà Hàng Hải Sản Biển Đông** (Database thời gian thực)

📊 **Tổng cộng: ${menuItems.length} món có sẵn**

🦐 **Danh sách đầy đủ:**
${menuItems.map((item, index) => `${index + 1}. ${item}`).join('\n')}

💰 **Giá từ thấp đến cao** | 📞 **Đặt món: 0936.253.588**`;
    } else {
      return `🍽️ **Menu đang được cập nhật**

📞 **Vui lòng gọi**: 0936.253.588 để biết món ăn hiện có
⏰ **Giờ mở**: 6:00-22:00 hàng ngày

**Xin lỗi vì sự bất tiện!**`;
    }
  }

  if (lowerQuestion.includes('đặt bàn') || lowerQuestion.includes('reservation') || lowerQuestion.includes('bàn')) {
    const totalTables = restaurantData.tables.length;
    const availableTables = restaurantData.availability.availableTables;
    const occupiedTables = totalTables - availableTables;
    
    return `📞 **Thông tin đặt bàn** (Database thời gian thực)

🔥 **Hotline**: 0936.253.588
📊 **Tình trạng bàn hiện tại**:
   • 🟢 Bàn trống: ${availableTables}/${totalTables} bàn
   • 🔴 Bàn đã đặt: ${occupiedTables} bàn
   • 📈 Tỷ lệ trống: ${Math.round((availableTables/totalTables)*100)}%

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