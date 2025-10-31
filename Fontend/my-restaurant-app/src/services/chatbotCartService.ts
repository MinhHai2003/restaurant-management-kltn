// Chat Bot Cart Service - Functions for chatbot to interact with cart
import { cartService } from './cartService';

interface MenuItem {
  _id: string;
  name: string;
  price: number;
  category: string;
  available: boolean;
  image?: string;
  description?: string;
}

interface CartItem {
  _id: string;
  name: string;
  quantity: number;
  price: number;
  subtotal: number;
  image?: string;
}


export interface ChatbotCartResult {
  success: boolean;
  message: string;
  data?: {
    items?: MenuItem[];
    suggestions?: MenuItem[] | string[];
    item?: MenuItem | CartItem;
    quantity?: number;
    totalPrice?: number;
    cartUpdated?: boolean;
    isEmpty?: boolean;
    itemCount?: number;
    total?: number;
  };
  error?: string;
}

// Function để chatbot tìm kiếm món ăn
export async function searchMenuItem(query: string): Promise<ChatbotCartResult> {
  try {
    console.log('🔍 Chatbot searching for:', query);
    
    const response = await fetch('http://localhost:5003/api/menu');
    if (!response.ok) {
      throw new Error('Failed to fetch menu');
    }
    
    const menuItems = await response.json();
    const lowerQuery = query.toLowerCase();
    
    // Tìm kiếm món theo tên (flexible search)
    const matches = menuItems.filter((item: MenuItem) => 
      item.name.toLowerCase().includes(lowerQuery) ||
      lowerQuery.includes(item.name.toLowerCase()) ||
      item.category.toLowerCase().includes(lowerQuery)
    );
    
    if (matches.length === 0) {
      return {
        success: false,
        message: `Không tìm thấy món "${query}". Bạn có thể xem menu đầy đủ tại website.`,
        data: { suggestions: menuItems.slice(0, 5).map((item: MenuItem) => item.name) }
      };
    }
    
    return {
      success: true,
      message: `Tìm thấy ${matches.length} món phù hợp với "${query}"`,
      data: { items: matches }
    };
    
  } catch (error) {
    console.error('Search menu error:', error);
    return {
      success: false,
      message: 'Có lỗi khi tìm kiếm món ăn. Vui lòng thử lại.',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Function để chatbot thêm món vào giỏ hàng
export async function addItemToCart(itemName: string, quantity: number = 1, notes?: string): Promise<ChatbotCartResult> {
  try {
    console.log('🛒 Chatbot adding to cart:', { itemName, quantity, notes });
    
    // Kiểm tra authentication
    if (!cartService.isAuthenticated()) {
      return {
        success: false,
        message: 'Bạn cần đăng nhập để thêm món vào giỏ hàng. Vui lòng đăng nhập trước nhé! 🔐',
      };
    }
    
    // Tìm món chính xác
    const searchResult = await searchMenuItem(itemName);
    if (!searchResult.success || !searchResult.data?.items?.length) {
      return {
        success: false,
        message: `Không tìm thấy món "${itemName}". ${searchResult.message}`,
        data: searchResult.data
      };
    }
    
    const menuItem = searchResult.data.items[0]; // Lấy kết quả đầu tiên
    
    // Kiểm tra món có sẵn không
    if (!menuItem.available) {
      return {
        success: false,
        message: `Món "${menuItem.name}" hiện tại không có sẵn. Bạn có thể chọn món khác nhé! 😔`,
      };
    }
    
    // Thêm vào giỏ hàng
    const result = await cartService.addToCart({
      menuItemId: menuItem._id,
      quantity: quantity,
      customizations: '',
      notes: notes || '',
    });
    
    if (result.success) {
      const price = menuItem.price * quantity;
      const formattedPrice = new Intl.NumberFormat('vi-VN').format(price) + 'đ';
      
      return {
        success: true,
        message: `✅ Đã thêm ${quantity} ${menuItem.name} vào giỏ hàng!\n💰 Thành tiền: ${formattedPrice}\n\n🛒 Bạn có thể xem giỏ hàng hoặc tiếp tục đặt thêm món khác.`,
        data: {
          item: menuItem,
          quantity: quantity,
          totalPrice: price,
          cartUpdated: true
        }
      };
    } else {
      return {
        success: false,
        message: `Có lỗi khi thêm "${menuItem.name}" vào giỏ hàng: ${result.error}`,
        error: result.error
      };
    }
    
  } catch (error) {
    console.error('Add to cart error:', error);
    return {
      success: false,
      message: 'Có lỗi không xác định khi thêm món vào giỏ hàng. Vui lòng thử lại.',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Function để chatbot xem giỏ hàng hiện tại
export async function getCartStatus(): Promise<ChatbotCartResult> {
  try {
    console.log('🛒 Chatbot checking cart status');
    
    if (!cartService.isAuthenticated()) {
      return {
        success: false,
        message: 'Bạn cần đăng nhập để xem giỏ hàng.',
      };
    }
    
    const result = await cartService.getCart();
    if (!result.success) {
      return {
        success: false,
        message: 'Không thể lấy thông tin giỏ hàng.',
        error: result.error
      };
    }
    
    const cart = result.data?.cart;
    if (!cart || cart.items.length === 0) {
      return {
        success: true,
        message: '🛒 Giỏ hàng của bạn đang trống. Hãy chọn món yêu thích nhé!',
        data: { isEmpty: true, itemCount: 0, total: 0 }
      };
    }
    
    const itemList = cart.items.map((item: CartItem, index: number) => 
      `${index + 1}. ${item.name} x${item.quantity} - ${new Intl.NumberFormat('vi-VN').format(item.subtotal)}đ`
    ).join('\n');
    
    const total = new Intl.NumberFormat('vi-VN').format(cart.summary.total) + 'đ';
    
    return {
      success: true,
      message: `🛒 **Giỏ hàng của bạn:**\n\n${itemList}\n\n💰 **Tổng cộng:** ${total}\n\n✨ Bạn có muốn thêm món nào khác không?`,
      data: {
        isEmpty: false,
        itemCount: cart.items.length,
        total: cart.summary.total
      }
    };
    
  } catch (error) {
    console.error('Get cart status error:', error);
    return {
      success: false,
      message: 'Có lỗi khi kiểm tra giỏ hàng.',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Function để chatbot gợi ý món ăn
export async function getMenuSuggestions(category?: string): Promise<ChatbotCartResult> {
  try {
    console.log('🍽️ Chatbot getting menu suggestions for category:', category);
    
    const response = await fetch('http://localhost:5003/api/menu');
    if (!response.ok) {
      throw new Error('Failed to fetch menu');
    }
    
    let menuItems = await response.json();
    
    // Lọc theo danh mục nếu có
    if (category) {
      const lowerCategory = category.toLowerCase();
      menuItems = menuItems.filter((item: MenuItem) => 
        item.category.toLowerCase().includes(lowerCategory) ||
        lowerCategory.includes(item.category.toLowerCase())
      );
    }
    
    // Chọn 5 món ngẫu nhiên
    const suggestions = menuItems
      .filter((item: MenuItem) => item.available)
      .sort(() => Math.random() - 0.5)
      .slice(0, 5);
    
    if (suggestions.length === 0) {
      return {
        success: false,
        message: category 
          ? `Không có món nào trong danh mục "${category}" hiện tại.`
          : 'Hiện tại chưa có món nào có sẵn.',
      };
    }
    
    const suggestionsList = suggestions.map((item: MenuItem, index: number) => 
      `${index + 1}. **${item.name}** - ${new Intl.NumberFormat('vi-VN').format(item.price)}đ`
    ).join('\n');
    
    const categoryText = category ? ` trong danh mục **${category}**` : '';
    
    return {
      success: true,
      message: `🍽️ **Gợi ý món ngon${categoryText}:**\n\n${suggestionsList}\n\n💬 Bạn muốn thêm món nào vào giỏ hàng? Chỉ cần nói "thêm [tên món]" là được!`,
      data: { suggestions }
    };
    
  } catch (error) {
    console.error('Get suggestions error:', error);
    return {
      success: false,
      message: 'Có lỗi khi lấy gợi ý món ăn.',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Function để chatbot xóa món khỏi giỏ hàng
export async function removeItemFromCart(itemName: string, quantity?: number): Promise<ChatbotCartResult> {
  try {
    console.log('🗑️ Chatbot removing from cart:', { itemName, quantity });
    
    if (!cartService.isAuthenticated()) {
      return {
        success: false,
        message: 'Bạn cần đăng nhập để xóa món khỏi giỏ hàng.',
      };
    }
    
    // Lấy giỏ hàng hiện tại để tìm món cần xóa
    const cartResult = await cartService.getCart();
    if (!cartResult.success || !cartResult.data?.cart) {
      return {
        success: false,
        message: 'Không thể lấy thông tin giỏ hàng.',
        error: cartResult.error
      };
    }
    
    const cart = cartResult.data.cart;
    if (!cart || cart.items.length === 0) {
      return {
        success: false,
        message: '🛒 Giỏ hàng của bạn đang trống. Không có món nào để xóa.',
      };
    }
    
    // Tìm món cần xóa (flexible search)
    const lowerItemName = itemName.toLowerCase();
    const matchingItem = cart.items.find((item: CartItem) => 
      item.name.toLowerCase().includes(lowerItemName) ||
      lowerItemName.includes(item.name.toLowerCase())
    );
    
    if (!matchingItem) {
      return {
        success: false,
        message: `Không tìm thấy món "${itemName}" trong giỏ hàng. Vui lòng kiểm tra lại tên món.`,
      };
    }
    
    // Quyết định xóa toàn bộ hay giảm số lượng
    if (quantity && quantity > 0 && quantity < matchingItem.quantity) {
      // Giảm số lượng
      const newQuantity = matchingItem.quantity - quantity;
      const result = await cartService.updateCartItem(matchingItem._id, newQuantity);
      
      if (result.success) {
        return {
          success: true,
          message: `✅ Đã giảm **${matchingItem.name}** từ ${matchingItem.quantity} xuống ${newQuantity}!\n\n🛒 Món vẫn còn trong giỏ hàng với số lượng ${newQuantity}.`,
          data: {
            item: matchingItem,
            cartUpdated: true,
            quantity: newQuantity
          }
        };
      } else {
        return {
          success: false,
          message: `Có lỗi khi cập nhật số lượng "${matchingItem.name}": ${result.error}`,
          error: result.error
        };
      }
    } else {
      // Xóa toàn bộ món
      const result = await cartService.removeFromCart(matchingItem._id);
      
      if (result.success) {
        return {
          success: true,
          message: `✅ Đã xóa **${matchingItem.name}** (${matchingItem.quantity} phần) khỏi giỏ hàng!\n\n🛒 Bạn có thể tiếp tục thêm hoặc xóa món khác.`,
          data: {
            item: matchingItem,
            cartUpdated: true
          }
        };
      } else {
        return {
          success: false,
          message: `Có lỗi khi xóa "${matchingItem.name}" khỏi giỏ hàng: ${result.error}`,
          error: result.error
        };
      }
    }
    
  } catch (error) {
    console.error('Remove from cart error:', error);
    return {
      success: false,
      message: 'Có lỗi không xác định khi xóa món khỏi giỏ hàng. Vui lòng thử lại.',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Function để chatbot xóa toàn bộ giỏ hàng
export async function clearCart(): Promise<ChatbotCartResult> {
  try {
    console.log('🗑️ Chatbot clearing entire cart');
    
    if (!cartService.isAuthenticated()) {
      return {
        success: false,
        message: 'Bạn cần đăng nhập để xóa giỏ hàng.',
      };
    }
    
    const result = await cartService.clearCart();
    
    if (result.success) {
      return {
        success: true,
        message: '✅ Đã xóa toàn bộ giỏ hàng!\n\n🛒 Giỏ hàng của bạn giờ đã trống. Hãy thêm món yêu thích nhé!',
        data: {
          cartUpdated: true,
          isEmpty: true,
          itemCount: 0,
          total: 0
        }
      };
    } else {
      return {
        success: false,
        message: `Có lỗi khi xóa giỏ hàng: ${result.error}`,
        error: result.error
      };
    }
    
  } catch (error) {
    console.error('Clear cart error:', error);
    return {
      success: false,
      message: 'Có lỗi không xác định khi xóa giỏ hàng. Vui lòng thử lại.',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Export all functions
export const chatbotCartTools = {
  searchMenuItem,
  addItemToCart,
  removeItemFromCart,
  clearCart,
  getCartStatus,
  getMenuSuggestions
};