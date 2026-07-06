import { useState } from 'react';
import { FiSearch } from 'react-icons/fi';
import toast from 'react-hot-toast';

// Mock data - backend API qo'shilganda o'zgartiriladi
const MOCK_GIFTS = [
  {
    id: 1,
    name: "Najot Ta'lim ruchkasi",
    price: 800,
    category: 'Barcha',
    image: 'https://via.placeholder.com/200x200/ffffff/1b253b?text=Ruchka',
    inStock: true,
  },
  {
    id: 2,
    name: "Stikerlar to'plami",
    price: 1100,
    category: 'Barcha',
    image: 'https://via.placeholder.com/200x200/1b253b/ffffff?text=Stikerlar',
    inStock: false,
  },
  {
    id: 3,
    name: "Najot Ta'lim stakani",
    price: 1400,
    category: 'Barcha',
    image: 'https://via.placeholder.com/200x200/10b981/ffffff?text=Stakan',
    inStock: false,
  },
  {
    id: 4,
    name: 'Sichqoncha uchun gilamcha',
    price: 1800,
    category: 'Barcha',
    image: 'https://via.placeholder.com/200x200/6b7280/ffffff?text=Gilamcha',
    inStock: false,
  },
  {
    id: 5,
    name: "Najot Ta'lim termosi",
    price: 2200,
    category: 'Barcha',
    image: 'https://via.placeholder.com/200x200/ffffff/1b253b?text=Termos',
    inStock: false,
  },
  {
    id: 6,
    name: 'Yondaftar',
    price: 3000,
    category: 'Barcha',
    image: 'https://via.placeholder.com/200x200/1b253b/ffffff?text=Yondaftar',
    inStock: false,
  },
  {
    id: 7,
    name: "Najot Ta'lim futbolkasi",
    price: 4400,
    category: 'Barcha',
    image: 'https://via.placeholder.com/200x200/1b253b/ffffff?text=Futbolka',
    inStock: false,
  },
  {
    id: 8,
    name: 'Osmondagi Bolalar futbolkasi',
    price: 4400,
    category: 'Barcha',
    image: 'https://via.placeholder.com/200x200/1b253b/ffffff?text=Futbolka',
    inStock: false,
  },
];

const CATEGORIES = ['Barcha', 'Kiyimlar', 'Aksessuarlar', 'Kitoblar', 'Boshqalar'];

const Gifts = () => {
  const [selectedCategory, setSelectedCategory] = useState('Barcha');
  const [priceFrom, setPriceFrom] = useState('');
  const [priceTo, setPriceTo] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showInStockOnly, setShowInStockOnly] = useState(false);

  // Filtrlarni qo'llash
  const getFilteredGifts = () => {
    let filtered = [...MOCK_GIFTS];

    // Kategoriya filtri
    if (selectedCategory !== 'Barcha') {
      filtered = filtered.filter((gift) => gift.category === selectedCategory);
    }

    // Narx oralig'i filtri
    if (priceFrom) {
      filtered = filtered.filter((gift) => gift.price >= Number(priceFrom));
    }
    if (priceTo) {
      filtered = filtered.filter((gift) => gift.price <= Number(priceTo));
    }

    // Qidiruv filtri
    if (searchQuery.trim()) {
      filtered = filtered.filter((gift) =>
        gift.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Faqat mavjudlarini ko'rsatish
    if (showInStockOnly) {
      filtered = filtered.filter((gift) => gift.inStock);
    }

    return filtered;
  };

  const filteredGifts = getFilteredGifts();

  const handleBuyGift = (gift) => {
    if (!gift.inStock) {
      toast.error("Afsuski, bu sovg'a hozirda mavjud emas!");
      return;
    }
    toast.success(`${gift.name} - ${gift.price} coin uchun sotib olindi!`);
  };

  return (
    <div style={{ padding: '24px', background: '#f9fafb', minHeight: '100vh' }}>
      <div style={{ 
        background: '#fff', 
        borderRadius: '16px', 
        padding: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '32px',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '700', color: '#111827' }}>
            Sovg'alar do'koni 🎁
          </h1>
          <div style={{
            padding: '12px 24px',
            background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 12px rgba(251, 191, 36, 0.3)'
          }}>
            <span style={{ fontSize: '20px' }}>🪙</span>
            <span style={{ fontSize: '18px', fontWeight: '700', color: '#fff' }}>
              5000 Coin
            </span>
          </div>
        </div>

        {/* Filtrlar */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '32px',
          padding: '20px',
          background: '#f9fafb',
          borderRadius: '12px'
        }}>
          {/* Kategoriya */}
          <div>
            <label style={{ 
              display: 'block', 
              fontSize: '13px', 
              fontWeight: '600', 
              color: '#374151',
              marginBottom: '8px'
            }}>
              Kategoriya
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                fontSize: '14px',
                cursor: 'pointer',
                background: '#fff'
              }}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Narx dan */}
          <div>
            <label style={{ 
              display: 'block', 
              fontSize: '13px', 
              fontWeight: '600', 
              color: '#374151',
              marginBottom: '8px'
            }}>
              Akssesuar qiymati dan
            </label>
            <input
              type="number"
              placeholder="dan"
              value={priceFrom}
              onChange={(e) => setPriceFrom(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Narx gacha */}
          <div>
            <label style={{ 
              display: 'block', 
              fontSize: '13px', 
              fontWeight: '600', 
              color: '#374151',
              marginBottom: '8px'
            }}>
              gacha
            </label>
            <input
              type="number"
              placeholder="gacha"
              value={priceTo}
              onChange={(e) => setPriceTo(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Qidiruv */}
          <div>
            <label style={{ 
              display: 'block', 
              fontSize: '13px', 
              fontWeight: '600', 
              color: '#374151',
              marginBottom: '8px'
            }}>
              Akssesuar nomi
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Qidirish..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 40px',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
              <FiSearch 
                size={18} 
                color="#9ca3af" 
                style={{ 
                  position: 'absolute', 
                  left: '12px', 
                  top: '50%', 
                  transform: 'translateY(-50%)' 
                }}
              />
            </div>
          </div>

          {/* Faqat mavjud */}
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <label style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              color: '#374151'
            }}>
              <input
                type="checkbox"
                checked={showInStockOnly}
                onChange={(e) => setShowInStockOnly(e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              Kumushlarim yetadi
            </label>
          </div>
        </div>

        {/* Sovg'alar grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: '24px',
          marginBottom: '32px'
        }}>
          {filteredGifts.length === 0 ? (
            <div style={{ 
              gridColumn: '1 / -1', 
              textAlign: 'center', 
              padding: '60px 20px',
              color: '#9ca3af'
            }}>
              <p style={{ fontSize: '18px', marginBottom: '8px' }}>🔍 Hech narsa topilmadi</p>
              <p style={{ fontSize: '14px' }}>Filtrlarni o'zgartirib ko'ring</p>
            </div>
          ) : (
            filteredGifts.map((gift) => (
              <div
                key={gift.id}
                style={{
                  background: '#fff',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  border: '1px solid #e5e7eb',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {/* Rasm */}
                <div style={{ 
                  width: '100%', 
                  height: '200px', 
                  background: '#f3f4f6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden'
                }}>
                  <img
                    src={gift.image}
                    alt={gift.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>

                {/* Ma'lumot */}
                <div style={{ padding: '16px' }}>
                  <h3 style={{ 
                    margin: '0 0 12px', 
                    fontSize: '16px', 
                    fontWeight: '600',
                    color: '#111827',
                    minHeight: '40px'
                  }}>
                    {gift.name}
                  </h3>
                  
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    marginBottom: '12px'
                  }}>
                    <span style={{ 
                      fontSize: '18px', 
                      fontWeight: '700', 
                      color: '#111827',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      {gift.price} <span style={{ fontSize: '16px' }}>🪙</span>
                    </span>
                  </div>

                  <button
                    onClick={() => handleBuyGift(gift)}
                    disabled={!gift.inStock}
                    style={{
                      width: '100%',
                      padding: '10px 16px',
                      borderRadius: '8px',
                      border: 'none',
                      background: gift.inStock 
                        ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                        : '#d1d5db',
                      color: '#fff',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: gift.inStock ? 'pointer' : 'not-allowed',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (gift.inStock) {
                        e.currentTarget.style.background = 'linear-gradient(135deg, #059669 0%, #047857 100%)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (gift.inStock) {
                        e.currentTarget.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
                      }
                    }}
                  >
                    {gift.inStock ? "Kumushingiz yetarli" : "Kumushingiz yetarli emas"}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer info */}
        {filteredGifts.length > 0 && (
          <div style={{ 
            textAlign: 'center',
            padding: '20px 0',
            color: '#6b7280',
            fontSize: '14px'
          }}>
            Jami {filteredGifts.length} ta sovg'a topildi
          </div>
        )}
      </div>
    </div>
  );
};

export default Gifts;
