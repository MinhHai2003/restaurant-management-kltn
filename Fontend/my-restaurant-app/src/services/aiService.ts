import { chatbotCartTools } from './chatbotCartService';

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

// Web Search API
const SERPER_API_KEY = import.meta.env.VITE_SERPER_API_KEY;

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
  
  // Step 1: Check if question is about cart operations
  const cartResponse = await handleCartOperations(question);
  if (cartResponse) {
    return cartResponse;
  }
  
  // Step 2: Fetch real data from database for menu questions
  const restaurantData = await fetchRestaurantData();
  
  // Step 3: Web search for general questions
  let webSearchResults: string | null = null;
  if (shouldSearchWeb(question)) {
    webSearchResults = await searchWeb(question);
  }
  
  // Step 4: Send question + real data + web search to AI
  const apiResponse = await tryFreeAPIs(question, restaurantData, webSearchResults || undefined);
  if (apiResponse) {
    return apiResponse;
  }
  
  // Step 5: Fallback to local AI with real data
  return getLocalAIResponse(question, restaurantData);
}

// New function to handle cart operations
async function handleCartOperations(question: string): Promise<string | null> {
  const lowerQuestion = question.toLowerCase();
  
  // 1. Thêm món vào giỏ hàng
  if (
    (lowerQuestion.includes('thêm') && !lowerQuestion.includes('thêm nguyên liệu')) ||
    (lowerQuestion.includes('đặt') && !lowerQuestion.includes('đặt bàn')) ||
    lowerQuestion.includes('order') ||
    lowerQuestion.includes('mua')
  ) {
    return await handleAddToCart(question);
  }
  
  // 2. Xóa toàn bộ giỏ hàng (kiểm tra trước để tránh xung đột)
  if (
    (lowerQuestion.includes('xóa') || lowerQuestion.includes('xoá') || lowerQuestion.includes('clear')) &&
    (lowerQuestion.includes('tất cả') || lowerQuestion.includes('toàn bộ') || lowerQuestion.includes('hết'))
  ) {
    const result = await chatbotCartTools.clearCart();
    return result.message;
  }
  
  // 3. Xóa món khỏi giỏ hàng (logic đơn giản hơn)
  if (
    lowerQuestion.includes('xóa') || lowerQuestion.includes('bỏ') || 
    lowerQuestion.includes('hủy') || lowerQuestion.includes('xoá') ||
    lowerQuestion.includes('remove')
  ) {
    // Kiểm tra xem có phải xóa bàn/nguyên liệu không
    if (!lowerQuestion.includes('bàn') && !lowerQuestion.includes('nguyên liệu')) {
      return await handleRemoveFromCart(question);
    }
  }
  
  // 4. Xem giỏ hàng
  if (lowerQuestion.includes('giỏ hàng') || lowerQuestion.includes('đã đặt')) {
    const result = await chatbotCartTools.getCartStatus();
    return result.message;
  }
  
  return null; // Không phải câu hỏi về giỏ hàng
}

// Handle adding items to cart
async function handleAddToCart(question: string): Promise<string> {
  try {
    // Extract dish name từ câu hỏi
    const dishName = extractDishName(question);
    
    if (!dishName) {
      return '🤔 Bạn muốn thêm món gì? Vui lòng nói rõ tên món, ví dụ: "Thêm cơm chiên hải sản"';
    }
    
    // Extract quantity (mặc định là 1)
    const quantity = extractQuantity(question);
    
    const result = await chatbotCartTools.addItemToCart(dishName, quantity);
    return result.message;
    
  } catch (error) {
    console.error('Handle add to cart error:', error);
    return 'Có lỗi khi thêm món vào giỏ hàng. Vui lòng thử lại!';
  }
}

// Handle removing items from cart
async function handleRemoveFromCart(question: string): Promise<string> {
  try {
    // Extract dish name từ câu hỏi
    const dishName = extractDishNameForRemoval(question);
    
    if (!dishName) {
      return '🤔 Bạn muốn xóa món gì khỏi giỏ hàng? Vui lòng nói rõ tên món, ví dụ: "Xóa cơm chiên hải sản" hoặc "Xóa 1 phần phở bò"';
    }
    
    // Extract quantity to remove (nếu có)
    const quantityToRemove = extractQuantityForRemoval(question);
    
    const result = await chatbotCartTools.removeItemFromCart(dishName, quantityToRemove);
    return result.message;
    
  } catch (error) {
    console.error('Handle remove from cart error:', error);
    return 'Có lỗi khi xóa món khỏi giỏ hàng. Vui lòng thử lại!';
  }
}

// Utility functions to extract information from user input
function extractDishName(question: string): string {
  // Remove common words but keep numbers for quantity
  const cleaned = question.toLowerCase()
    .replace(/\b(thêm|vào|giỏ|hàng|đặt|món|order|mua|cho|tôi|em|anh|chị)\b/g, '')
    .replace(/\b(\d+)\s*(phần|suất|đĩa|tô|ly|cái)\b/g, '') // Remove quantity expressions
    .trim();
  
  // If cleaned result is too short, try different approach
  if (cleaned.length < 3) {
    // Extract everything after "thêm" or "đặt"
    const afterThemMatch = question.toLowerCase().match(/(?:thêm|đặt|order|mua)\s+(.+?)(?:\s+vào|$)/);
    if (afterThemMatch) {
      return afterThemMatch[1]
        .replace(/\b(\d+)\s*(phần|suất|đĩa|tô|ly|cái)\b/g, '')
        .trim();
    }
  }
  
  // Common dish patterns - expanded
  const patterns = [
    /phở\s+[a-zA-ZÀ-ỹ\s]+/,
    /cơm chiên [a-zA-ZÀ-ỹ\s]+/,
    /lẩu [a-zA-ZÀ-ỹ\s]+/,
    /[a-zA-ZÀ-ỹ\s]*hải sản[a-zA-ZÀ-ỹ\s]*/,
    /[a-zA-ZÀ-ỹ\s]*tôm[a-zA-ZÀ-ỹ\s]*/,
    /[a-zA-ZÀ-ỹ\s]*cá[a-zA-ZÀ-ỹ\s]*/,
    /[a-zA-ZÀ-ỹ\s]*gà[a-zA-ZÀ-ỹ\s]*/,
    /[a-zA-ZÀ-ỹ\s]*bò[a-zA-ZÀ-ỹ\s]*/,
  ];
  
  for (const pattern of patterns) {
    const match = cleaned.match(pattern);
    if (match) {
      return match[0].trim();
    }
  }
  
  // Fallback: take the remaining text if it's meaningful
  return cleaned.trim();
}

function extractQuantity(question: string): number {
  const match = question.match(/(\d+)\s*(phần|suất|đĩa|tô|ly)?/);
  return match ? parseInt(match[1]) : 1;
}

function extractDishNameForRemoval(question: string): string {
  // Remove common words for removal
  const cleaned = question.toLowerCase()
    .replace(/\b(xóa|bỏ|hủy|xoá|remove|delete|khỏi|giỏ|hàng|món)\b/g, '')
    .replace(/\b(\d+)\s*(phần|suất|đĩa|tô|ly|cái)\b/g, '') // Remove quantity expressions
    .trim();
  
  // If cleaned result is too short, try different approach
  if (cleaned.length < 3) {
    // Extract everything after "xóa" or "bỏ"
    const afterRemoveMatch = question.toLowerCase().match(/(?:xóa|bỏ|hủy|xoá)\s+(.+?)(?:\s+khỏi|$)/);
    if (afterRemoveMatch) {
      return afterRemoveMatch[1]
        .replace(/\b(\d+)\s*(phần|suất|đĩa|tô|ly|cái)\b/g, '')
        .replace(/\b(món|khỏi|giỏ|hàng)\b/g, '')
        .trim();
    }
  }
  
  // Common dish patterns - same as add
  const patterns = [
    /phở\s+[a-zA-ZÀ-ỹ\s]+/,
    /cơm chiên [a-zA-ZÀ-ỹ\s]+/,
    /lẩu [a-zA-ZÀ-ỹ\s]+/,
    /[a-zA-ZÀ-ỹ\s]*hải sản[a-zA-ZÀ-ỹ\s]*/,
    /[a-zA-ZÀ-ỹ\s]*tôm[a-zA-ZÀ-ỹ\s]*/,
    /[a-zA-ZÀ-ỹ\s]*cá[a-zA-ZÀ-ỹ\s]*/,
    /[a-zA-ZÀ-ỹ\s]*gà[a-zA-ZÀ-ỹ\s]*/,
    /[a-zA-ZÀ-ỹ\s]*bò[a-zA-ZÀ-ỹ\s]*/,
  ];
  
  for (const pattern of patterns) {
    const match = cleaned.match(pattern);
    if (match) {
      return match[0].trim();
    }
  }
  
  // Fallback: take the remaining text if it's meaningful
  return cleaned.trim();
}

function extractQuantityForRemoval(question: string): number | undefined {
  // Tìm pattern "xóa [số] [đơn vị]" hoặc "bỏ [số] [đơn vị]"
  const patterns = [
    /(?:xóa|bỏ|hủy|xoá|remove)\s+(\d+)\s*(?:phần|suất|đĩa|tô|ly|cái)?/,
    /(\d+)\s*(?:phần|suất|đĩa|tô|ly|cái)?\s+(?:xóa|bỏ|hủy|xoá)/
  ];
  
  for (const pattern of patterns) {
    const match = question.toLowerCase().match(pattern);
    if (match) {
      const quantity = parseInt(match[1]);
      return quantity > 0 ? quantity : undefined;
    }
  }
  
  return undefined; // Không có số lượng cụ thể = xóa toàn bộ
}

async function tryFreeAPIs(question: string, restaurantData: RestaurantData, webSearchResults?: string): Promise<string | null> {
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
          response = await callGroqAPI(question, apiKey, restaurantData, webSearchResults);
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

// Check if question needs web search
function shouldSearchWeb(question: string): boolean {
  const lowerQuestion = question.toLowerCase();
  
  // Don't search for restaurant-specific questions
  const restaurantKeywords = [
    'menu', 'món ăn', 'giá', 'bàn', 'đặt bàn',
    'nhà hàng', 'restaurant', 'hải sản',
    'giỏ hàng', 'cart', 'thanh toán',
    'order', 'đơn hàng', 'món', 'thức ăn',
    'table', 'bàn ăn', 'reservation', 'đặt chỗ'
  ];
  
  // Check if it's a restaurant question
  const isRestaurantQuestion = restaurantKeywords.some(keyword => 
    lowerQuestion.includes(keyword)
  );
  
  if (isRestaurantQuestion) {
    return false;
  }
  
  // Search web for all other questions
  return true;
}

// Web Search API using Serper.dev
async function searchWeb(query: string): Promise<string | null> {
  if (!SERPER_API_KEY) {
    console.log('🔍 Serper API key not found, skipping web search');
    return null;
  }

  try {
    console.log('🔍 Searching web for:', query);
    
    const response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': SERPER_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: query,
        num: 5, // Lấy 5 kết quả đầu tiên
        gl: 'vn', // Google Vietnam
        hl: 'vi' // Tiếng Việt
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('🔍 Web search results:', data);
      
      // Tạo summary từ kết quả tìm kiếm
      let searchSummary = 'THÔNG TIN TÌM KIẾM WEB:\n\n';
      
      if (data.organic && data.organic.length > 0) {
        data.organic.slice(0, 3).forEach((result: any, index: number) => {
          searchSummary += `${index + 1}. **${result.title}**\n`;
          searchSummary += `   ${result.snippet}\n`;
          searchSummary += `   Nguồn: ${result.link}\n\n`;
        });
      }
      
      if (data.knowledgeGraph) {
        searchSummary += `**THÔNG TIN CHI TIẾT:**\n`;
        searchSummary += `${data.knowledgeGraph.description}\n`;
        searchSummary += `Nguồn: ${data.knowledgeGraph.descriptionSource}\n\n`;
      }
      
      return searchSummary;
    } else {
      console.error('🔍 Serper API Error:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('🔍 Web search error:', error);
  }
  
  return null;
}

async function callGroqAPI(question: string, apiKey: string, restaurantData: RestaurantData, webSearchResults?: string): Promise<string | null> {
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

THÔNG TIN THỰC TẾ TỪ DATABASE:
${menuInfo}

${tableInfo}${webSearchResults ? `\n\n${webSearchResults}` : ''}

QUAN TRỌNG: 
- Khi hỏi về số lượng món, trả lời chính xác số món có sẵn
- Khi hỏi về bàn, cung cấp thông tin chi tiết về tỷ lệ trống/đã đặt
- Luôn dựa trên dữ liệu thực tế từ database
- Khi hỏi về thời gian, trả lời theo múi giờ Việt Nam (GMT+7)
- Sử dụng thông tin web search để bổ sung câu trả lời nếu cần

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