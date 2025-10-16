const API_BASE_URL = 'http://localhost:5005/api';

export interface ReviewData {
  menuItemId: string;
  menuItemName?: string;
  rating: number;
  comment: string;
  images: string[];
}

export interface Review {
  id: string;
  orderNumber: string;
  menuItemName: string;
  rating: number;
  starRating: string;
  comment: string;
  images: string[];
  ratedAt: string;
  canEdit: boolean;
}

export interface MenuItemReview {
  id: string;
  menuItemName: string;
  rating: number;
  comment: string;
  customerName: string;
  ratedAt: string;
}

export interface TopRatedItem {
  _id: string;
  menuItemName: string;
  averageRating: number;
  totalReviews: number;
  starRating: string;
  ratingPercentage: number;
  name?: string;
  description?: string;
  price?: number;
  image?: string;
  category?: string;
}

export interface CustomerRecommendation {
  favoriteItems: Array<{
    _id: string;
    name: string;
    totalQuantity: number;
    totalSpent: number;
    lastOrderDate: string;
    orderCount: number;
  }>;
  topRatedInCategories: Array<{
    _id: string;
    menuItemName: string;
    averageRating: number;
    totalReviews: number;
  }>;
  trendingItems: Array<{
    _id: string;
    name: string;
    recentOrders: number;
    totalRevenue: number;
  }>;
  newItems: Array<{
    _id: string;
    name: string;
    description: string;
    price: number;
    image: string;
    category: string;
  }>;
  favoriteCategories: string[];
}

class ReviewService {
  private getHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    };
  }

  // Submit order review
  async submitOrderReview(orderNumber: string, items: ReviewData[]): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/reviews/order/${orderNumber}`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ items }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to submit review');
      }

      return { success: true, data: result.data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to submit review',
      };
    }
  }

  // Get customer's review history
  async getMyReviews(page = 1, limit = 10): Promise<{ success: boolean; data?: { reviews: Review[]; pagination: any }; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/reviews/customer/my-reviews?page=${page}&limit=${limit}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch reviews');
      }

      return { success: true, data: result.data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch reviews',
      };
    }
  }

  // Get reviews for a specific menu item
  async getMenuItemReviews(menuItemId: string, page = 1, limit = 10, sort = 'newest'): Promise<{ success: boolean; data?: { reviews: MenuItemReview[]; ratingStats: any; pagination: any }; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/reviews/menu-item/${menuItemId}?page=${page}&limit=${limit}&sort=${sort}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch menu item reviews');
      }

      return { success: true, data: result.data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch menu item reviews',
      };
    }
  }

  // Get top rated items
  async getTopRated(limit = 10, minReviews = 1): Promise<{ success: boolean; data?: TopRatedItem[]; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/reviews/top-rated?limit=${limit}&minReviews=${minReviews}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch top rated items');
      }

      return { success: true, data: result.data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch top rated items',
      };
    }
  }

  // Get personalized recommendations
  async getRecommendations(): Promise<{ success: boolean; data?: CustomerRecommendation; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/reviews/customer/recommendations`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch recommendations');
      }

      return { success: true, data: result.data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch recommendations',
      };
    }
  }

  // Update existing review
  async updateReview(reviewId: string, rating?: number, comment?: string, images?: string[]): Promise<{ success: boolean; data?: Review; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/reviews/${reviewId}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify({ rating, comment, images }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to update review');
      }

      return { success: true, data: result.data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update review',
      };
    }
  }

  // Delete review
  async deleteReview(reviewId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to delete review');
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete review',
      };
    }
  }

  // Helper function to format rating display
  formatRatingDisplay(rating: number, totalReviews: number): string {
    if (totalReviews === 0) return 'Chưa có đánh giá';
    return `${rating.toFixed(1)} ⭐ (${totalReviews} đánh giá)`;
  }

  // Helper function to get rating color class
  getRatingColorClass(rating: number): string {
    if (rating >= 4.5) return 'text-yellow-500';
    if (rating >= 3.5) return 'text-yellow-400';
    if (rating >= 2.5) return 'text-yellow-300';
    if (rating >= 1.5) return 'text-orange-400';
    return 'text-red-400';
  }

  // Helper function to generate star rating string
  generateStarRating(rating: number): string {
    const stars = Math.round(rating);
    return '★'.repeat(stars) + '☆'.repeat(5 - stars);
  }
}

export default new ReviewService();
