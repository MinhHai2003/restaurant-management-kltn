import { useEffect, useMemo, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import ProductCard from '../components/ui/ProductCard';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import menuService from '../services/menuService';
import type { MenuItem } from '../services/menuService';
import { categories } from '../data/products';

interface UIProduct {
  id: number;
  menuItemId?: string;
  name: string;
  price: number;
  unit: string;
  originalPrice?: number | null;
  image: string;
  category: string;
  description?: string;
  isNew?: boolean;
  isBestSeller?: boolean;
}

const CategoryPage: React.FC = () => {
  const { slug } = useParams();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const location = useLocation();

  const selectedSubcategory = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const sub = params.get('sub');
    return sub || undefined;
  }, [location.search]);

  const activeCategory = useMemo(() => {
    return categories.find((c) => c.slug === slug);
  }, [slug]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        // Backend may ignore category filter; we filter client-side by subcategory slugs
        const res = await menuService.getMenuItems();
        if (res.success) {
          let fetched = res.data?.items || [];
          const allowed = selectedSubcategory
            ? [selectedSubcategory]
            : (activeCategory?.subcategories || []).map((s) => s.slug);
          if (allowed.length > 0) {
            fetched = fetched.filter((it: any) => allowed.includes(String(it.category).toLowerCase()));
          }
          setItems(fetched);
        } else {
          setError(res.error || 'Không thể tải sản phẩm');
        }
      } catch (e) {
        setError('Không thể tải sản phẩm');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeCategory?.name, selectedSubcategory]);

  const uiProducts: UIProduct[] = useMemo(() => {
    return (items || []).map((it, idx) => ({
      id: idx + 1,
      menuItemId: (it as any)._id,
      name: it.name,
      description: it.description,
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
        <h2 style={{ 
          fontSize: '26px', 
          fontWeight: 900, 
          marginBottom: '8px', 
          letterSpacing: '0.5px',
          color: '#0f172a'
        }}>
          {activeCategory ? activeCategory.name : 'Danh mục'}
        </h2>
        <div style={{ height: '4px', width: '72px', background: 'linear-gradient(90deg,#0ea5e9,#06b6d4)', borderRadius: '2px', marginBottom: '16px' }} />
        {/* Subcategory chips */}
        {activeCategory && activeCategory.subcategories?.length > 0 && (
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: '8px', 
            marginBottom: '20px',
            overflowX: 'auto',
            paddingBottom: '8px',
            WebkitOverflowScrolling: 'touch'
          }}
          className="subcategory-chips-scroll"
          >
            {[{ name: 'Tất cả', slug: '' }, ...activeCategory.subcategories].map((sub, idx) => {
              const isActive = (!selectedSubcategory && idx === 0) || (selectedSubcategory && sub.slug === selectedSubcategory);
              const href = sub.slug ? `/menu/${activeCategory.slug}?sub=${sub.slug}` : `/menu/${activeCategory.slug}`;
              return (
                <a
                  key={idx}
                  href={href}
                  style={{
                    textDecoration: 'none',
                    padding: '8px 14px',
                    borderRadius: '999px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    background: isActive ? 'linear-gradient(135deg,#0ea5e9,#06b6d4)' : '#e2e8f0',
                    color: isActive ? 'white' : '#0f172a',
                    boxShadow: isActive ? '0 6px 16px rgba(14,165,233,0.35)' : 'none',
                    whiteSpace: 'nowrap',
                    minHeight: '36px',
                    display: 'inline-flex',
                    alignItems: 'center'
                  }}
                >
                  {sub.name}
                </a>
              );
            })}
          </div>
        )}

        {loading && <div>Đang tải sản phẩm...</div>}
        {error && !loading && <div style={{ color: '#ef4444' }}>{error}</div>}

        {!loading && !error && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '20px',
          }}
          className="products-grid-responsive"
          >
            {uiProducts.map((p) => (
              <ProductCard key={p.menuItemId || p.id} product={p} />
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default CategoryPage;


