import React, { useState, useEffect } from 'react';
import AccountLayout from '../../components/account/AccountLayout';
import RatingStars from '../../components/RatingStars';
import reviewService from '../../services/reviewService';
import type { CustomerRecommendation, TopRatedItem } from '../../services/reviewService';

const RecommendationsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<CustomerRecommendation | null>(null);
  const [topRated, setTopRated] = useState<TopRatedItem[]>([]);
  const [activeTab, setActiveTab] = useState<'personal' | 'top-rated'>('personal');

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);

      const [recResult, topRatedResult] = await Promise.all([
        reviewService.getRecommendations(),
        reviewService.getTopRated(10, 1)
      ]);

      if (recResult.success && recResult.data) {
        setRecommendations(recResult.data);
      }

      if (topRatedResult.success && topRatedResult.data) {
        console.log('Top rated data:', topRatedResult.data);
        setTopRated(topRatedResult.data);
      } else {
        console.log('Top rated failed:', topRatedResult);
      }
    } catch (err) {
      setError('Không thể tải dữ liệu gợi ý');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('vi-VN') + 'đ';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  if (loading) {
    return (
      <AccountLayout activeTab="recommendations">
        <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#6b7280' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⭐</div>
          <div>Đang tải gợi ý cho bạn...</div>
        </div>
      </AccountLayout>
    );
  }

  if (error) {
    return (
      <AccountLayout activeTab="recommendations">
        <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#ef4444' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>❌</div>
          <div>{error}</div>
          <button
            onClick={fetchRecommendations}
            style={{
              marginTop: '1rem',
              padding: '0.5rem 1rem',
              background: '#0ea5e9',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: 'pointer'
            }}
          >
            Thử lại
          </button>
        </div>
      </AccountLayout>
    );
  }

  return (
    <AccountLayout activeTab="recommendations">
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1rem' }}>
        {/* Header */}
        <div style={{
          background: 'white',
          borderRadius: '0.75rem',
          padding: '2rem',
          marginBottom: '2rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <h1 style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            color: '#1f2937',
            margin: 0,
            marginBottom: '0.5rem'
          }}>
            ⭐ Gợi ý cho bạn
          </h1>
          <p style={{ color: '#6b7280', margin: 0 }}>
            Khám phá những món ăn phù hợp với sở thích của bạn
          </p>
        </div>

        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          marginBottom: '2rem',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <button
            onClick={() => setActiveTab('personal')}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'personal' ? '2px solid #0ea5e9' : '2px solid transparent',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: activeTab === 'personal' ? '#0ea5e9' : '#6b7280',
              transition: 'all 0.2s'
            }}
          >
            Gợi ý cá nhân
          </button>
          <button
            onClick={() => setActiveTab('top-rated')}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'top-rated' ? '2px solid #0ea5e9' : '2px solid transparent',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: activeTab === 'top-rated' ? '#0ea5e9' : '#6b7280',
              transition: 'all 0.2s'
            }}
          >
            Món được đánh giá cao nhất
          </button>
        </div>

        {/* Personal Recommendations */}
        {activeTab === 'personal' && recommendations && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Favorite Items */}
            {recommendations.favoriteItems.length > 0 && (
              <div style={{
                background: 'white',
                borderRadius: '0.75rem',
                padding: '1.5rem',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
              }}>
                <h2 style={{
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  color: '#1f2937',
                  margin: 0,
                  marginBottom: '1rem'
                }}>
                  🍽️ Món bạn yêu thích
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                  {recommendations.favoriteItems.map((item, index) => (
                    <div key={index} style={{
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.5rem',
                      padding: '1rem',
                      background: '#f9fafb'
                    }}>
                      <h3 style={{
                        fontSize: '1rem',
                        fontWeight: '600',
                        color: '#1f2937',
                        margin: 0,
                        marginBottom: '0.5rem'
                      }}>
                        {item.name}
                      </h3>
                      <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                        <div>Đã đặt: {item.totalQuantity} lần</div>
                        <div>Tổng chi tiêu: {formatPrice(item.totalSpent)}</div>
                        <div>Lần cuối: {formatDate(item.lastOrderDate)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Top Rated in Categories */}
            {recommendations.topRatedInCategories.length > 0 && (
              <div style={{
                background: 'white',
                borderRadius: '0.75rem',
                padding: '1.5rem',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
              }}>
                <h2 style={{
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  color: '#1f2937',
                  margin: 0,
                  marginBottom: '1rem'
                }}>
                  ⭐ Món được đánh giá cao trong danh mục yêu thích
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                  {recommendations.topRatedInCategories.map((item, index) => (
                    <div key={index} style={{
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.5rem',
                      padding: '1rem',
                      background: '#f9fafb'
                    }}>
                      <h3 style={{
                        fontSize: '1rem',
                        fontWeight: '600',
                        color: '#1f2937',
                        margin: 0,
                        marginBottom: '0.5rem'
                      }}>
                        {item.menuItemName}
                      </h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <RatingStars value={item.averageRating} readonly size="sm" />
                        <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                          ({item.totalReviews} đánh giá)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Trending Items */}
            {recommendations.trendingItems.length > 0 && (
              <div style={{
                background: 'white',
                borderRadius: '0.75rem',
                padding: '1.5rem',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
              }}>
                <h2 style={{
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  color: '#1f2937',
                  margin: 0,
                  marginBottom: '1rem'
                }}>
                  🔥 Món đang thịnh hành
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                  {recommendations.trendingItems.map((item, index) => (
                    <div key={index} style={{
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.5rem',
                      padding: '1rem',
                      background: '#f9fafb'
                    }}>
                      <h3 style={{
                        fontSize: '1rem',
                        fontWeight: '600',
                        color: '#1f2937',
                        margin: 0,
                        marginBottom: '0.5rem'
                      }}>
                        {item.name}
                      </h3>
                      <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                        <div>Đơn hàng gần đây: {item.recentOrders}</div>
                        <div>Doanh thu: {formatPrice(item.totalRevenue)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* New Items */}
            {recommendations.newItems.length > 0 && (
              <div style={{
                background: 'white',
                borderRadius: '0.75rem',
                padding: '1.5rem',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
              }}>
                <h2 style={{
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  color: '#1f2937',
                  margin: 0,
                  marginBottom: '1rem'
                }}>
                  🆕 Món mới bạn chưa thử
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                  {recommendations.newItems.map((item, index) => (
                    <div key={index} style={{
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.5rem',
                      padding: '1rem',
                      background: '#f9fafb'
                    }}>
                      <h3 style={{
                        fontSize: '1rem',
                        fontWeight: '600',
                        color: '#1f2937',
                        margin: 0,
                        marginBottom: '0.5rem'
                      }}>
                        {item.name}
                      </h3>
                      <p style={{
                        fontSize: '0.875rem',
                        color: '#6b7280',
                        margin: 0,
                        marginBottom: '0.5rem'
                      }}>
                        {item.description}
                      </p>
                      <div style={{ fontSize: '0.875rem', color: '#1f2937', fontWeight: '600' }}>
                        {formatPrice(item.price)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Top Rated Items */}
        {activeTab === 'top-rated' && (
          <div style={{
            background: 'white',
            borderRadius: '0.75rem',
            padding: '1.5rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: '600',
              color: '#1f2937',
              margin: 0,
              marginBottom: '1rem'
            }}>
              ⭐ Món được đánh giá cao nhất
            </h2>
            {topRated.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📊</div>
                <div>Chưa có dữ liệu đánh giá</div>
                <div style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
                  Hãy đánh giá món ăn để xem gợi ý
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                {topRated.map((item, index) => (
                <div key={index} style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  padding: '1rem',
                  background: '#f9fafb'
                }}>
                  <h3 style={{
                    fontSize: '1rem',
                    fontWeight: '600',
                    color: '#1f2937',
                    margin: 0,
                    marginBottom: '0.5rem'
                  }}>
                    {item.menuItemName}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <RatingStars value={item.averageRating} readonly size="sm" />
                    <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                      ({item.totalReviews} đánh giá)
                    </span>
                  </div>
                  {item.price && (
                    <div style={{ fontSize: '0.875rem', color: '#1f2937', fontWeight: '600' }}>
                      {formatPrice(item.price)}
                    </div>
                  )}
                </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </AccountLayout>
  );
};

export default RecommendationsPage;
