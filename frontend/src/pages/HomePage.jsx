import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Package, ShoppingCart, CheckCircle2, Loader2, CreditCard, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext'; // Import useCart
import { useNavigate } from 'react-router-dom';

// API endpoints
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const API_BASE = {
  products: `${API_BASE_URL}/api/v1`,
  orders: `${API_BASE_URL}/api/v1`,
};

function HomePage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeOrder, setActiveOrder] = useState(null);
  const [sagaStatus, setSagaStatus] = useState('idle');
  const [error, setError] = useState(null);
  
  const { user } = useAuth();
  const { addToCart } = useCart(); // Use cart hook
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const resp = await axios.get(`${API_BASE.products}/products`);
      setProducts(resp.data.products || []);
      setLoading(false);
    } catch (err) {
      console.error('Fetch products error:', err);
      setError('Could not fetch products. Make sure services are running.');
      setLoading(false);
    }
  };

  const handleAddToCart = (product) => {
    addToCart(product);
    // Optional: Show a toast or feedback
  };

  // Keep handleBuy for "Buy Now" functionality if needed, or remove
  const handleBuyNow = async (product) => {
     if (!user) {
        navigate('/login');
        return;
    }
    // Existing saga logic...
    // For now, let's focus on Add to Cart as the primary action
    addToCart(product);
    navigate('/cart');
  };

  return (
    <div className="container">
      {error && (
        <div className="glass" style={{ padding: '1rem', marginBottom: '2rem', borderColor: '#ef4444', color: '#fca5a5' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '5rem' }}>
          <Loader2 className="animate-spin" size={48} color="#6366f1" />
          <p style={{ marginTop: '1rem', color: '#94a3b8' }}>Loading products...</p>
        </div>
      ) : (
        <div className="product-grid animate-fade-in">
          {products.map(product => (
            <div key={product.id} className="glass product-card">
              <img 
                src={product.imageUrl || `https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=400`} 
                alt={product.name} 
                className="product-image"
              />
              <h3 className="product-title">{product.name}</h3>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1rem' }}>{product.description}</p>
              <div className="product-price">${parseFloat(product.price).toFixed(2)}</div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <button 
                    className="buy-btn" 
                    style={{ backgroundColor: '#4f46e5' }}
                    onClick={() => handleAddToCart(product)}
                  >
                    Add to Cart
                  </button>
                  <button 
                    className="buy-btn" 
                    onClick={() => handleBuyNow(product)}
                  >
                    Buy Now
                  </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default HomePage;
