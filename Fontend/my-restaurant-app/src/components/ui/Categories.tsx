import { categories } from '../../data/products';

const Categories: React.FC = () => {
  return (
    <section className="categories-section">
      <div className="container">
        <h2 className="section-title">Danh mục sản phẩm</h2>
        
        <div className="categories-grid">
          {categories.map((category) => (
            <div key={category.id} className="category-card">
              <div className="category-image">
                <img 
                  src={category.image} 
                  alt={category.name}
                  loading="lazy"
                />
                <div className="category-overlay">
                  <h3>{category.name}</h3>
                  <p>{category.subcategories.length} loại</p>
                </div>
              </div>
              
              <div className="category-content">
                <h4>{category.name}</h4>
                <div className="subcategories">
                  {category.subcategories.slice(0, 3).map((sub, index) => (
                    <span key={index} className="subcategory-tag">
                      {sub.name}
                    </span>
                  ))}
                  {category.subcategories.length > 3 && (
                    <span className="subcategory-more">
                      +{category.subcategories.length - 3} loại khác
                    </span>
                  )}
                </div>
                <a href={`/category/${category.slug}`} className="view-category-btn">
                  Xem tất cả
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Categories;
