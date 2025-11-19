import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import ProductCard from '../components/ui/ProductCard';
import menuService, { type MenuItem } from '../services/menuService';

interface UIProduct {
  id: number;
  menuItemId?: string;
  name: string;
  price: number;
  unit: string;
  originalPrice?: number | null;
  image: string;
  category: string;
  isNew?: boolean;
  isBestSeller?: boolean;
}

const SearchPage: React.FC = () => {
  const location = useLocation();
  const query = useMemo(() => new URLSearchParams(location.search).get('q') || '', [location.search]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError('');
      try {
        if (!query.trim()) {
          setItems([]);
          return;
        }

        const normalize = (s: string) =>
          s
            .toLowerCase()
            .normalize('NFD')
            .replace(/\p{Diacritic}+/gu, '');
        const normalizedQuery = normalize(query);

        const applyLocalFilter = (source: MenuItem[]) =>
          source.filter((item) => {
            const name = normalize(item.name || '');
            return name.includes(normalizedQuery);
          });

        let fetched: MenuItem[] = [];

        // Try dedicated search endpoint first for better accuracy
        const searchRes = await menuService.searchMenuItems(query);
        if (searchRes.success && Array.isArray(searchRes.data?.items)) {
          fetched = searchRes.data?.items || [];
        } else {
          // Fallback to general listing if search API unavailable
          const fallbackRes = await menuService.getMenuItems({ search: query, limit: 200 });
          if (!fallbackRes.success) {
            throw new Error(fallbackRes.error || 'Không thể tìm kiếm');
          }
          fetched = ((fallbackRes.data?.items as any) || []) as MenuItem[];
        }

        const filtered = applyLocalFilter(fetched);
        setItems(filtered);
      } catch (e) {
        console.error('❌ [SEARCH PAGE] Error searching menu:', e);
        setError('Không thể tìm kiếm món ăn theo từ khóa này. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [query]);

  const uiProducts: UIProduct[] = useMemo(() => {
    return (items || []).map((it, idx) => ({
      id: idx + 1,
      menuItemId: (it as any)._id,
      name: it.name,
      price: it.price,
      unit: 'phần',
      originalPrice: undefined,
      image: it.image,
      category: it.category,
      isNew: false,
      isBestSeller: false,
    }));
  }, [items]);

  return (
    <div style={{ minHeight: '100vh', background: 'white' }}>
      <Header />
      <div className="container" style={{ padding: '24px 0' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 900, marginBottom: '8px', letterSpacing: '0.5px', color: '#0f172a' }}>
          Kết quả tìm kiếm
        </h2>
        <div style={{ marginBottom: '16px', color: '#64748b' }}>
          Từ khóa: <strong>{query}</strong>
        </div>

        {loading && <div>Đang tìm kiếm...</div>}
        {error && !loading && <div style={{ color: '#ef4444' }}>{error}</div>}

        {!loading && !error && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '20px',
          }}>
            {uiProducts.map((p) => (
              <ProductCard key={p.menuItemId || p.id} product={p} />
            ))}
          </div>
        )}

        {!loading && !error && uiProducts.length === 0 && (
          <div style={{ color: '#64748b' }}>Không tìm thấy món phù hợp.</div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default SearchPage;


