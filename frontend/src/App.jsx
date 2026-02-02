import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Package, ShoppingCart, CheckCircle2, Loader2, CreditCard, ShieldCheck } from 'lucide-react';

// API endpoints - use environment variable or default to localhost
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const API_BASE = {
  products: `${API_BASE_URL}/api/v1`,
  orders: `${API_BASE_URL}/api/v1`,
  inventory: `${API_BASE_URL}/api/v1`,
};

// Hardcoded User ID for demo
const USER_ID = 'f25a9946-06ae-450d-95d1-0829e024810a';

function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeOrder, setActiveOrder] = useState(null);
  const [sagaStatus, setSagaStatus] = useState('idle'); // idle, creating, inventory_reserved, payment_processing, completed, failed
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const resp = await axios.get(`${API_BASE.products}/products`);
      // The API returns { products: [...] } but sometimes it's nested
      setProducts(resp.data.products || []);
      setLoading(false);
    } catch (err) {
      console.error('Fetch products error:', err);
      setError('Could not fetch products. Make sure services are running.');
      setLoading(false);
    }
  };

  const handleBuy = async (product) => {
    setSagaStatus('creating');
    setActiveOrder({ productName: product.name });
    setError(null);

    try {
      const orderPayload = {
        userId: USER_ID,
        items: [{
          productId: product.id,
          quantity: 1,
          price: product.price
        }],
        shippingAddress: {
          street: '123 Main St',
          city: 'San Francisco',
          state: 'CA',
          zip: '94105',
          country: 'USA'
        }
      };

      const resp = await axios.post(`${API_BASE.orders}/orders`, orderPayload);
      const orderId = resp.data.order.id;
      
      // Since our backend handles the Saga synchronously in the controller for this demo,
      // we can simulate the visual steps or poll.
      // In this implementation, the backend waits for the Saga to finish before returning.
      
      setSagaStatus('completed');
      setActiveOrder(prev => ({ ...prev, id: orderId }));
      
      // Refresh products to see updated inventory (optional)
      setTimeout(() => fetchProducts(), 2000);

    } catch (err) {
      console.error('Order error:', err);
      setSagaStatus('failed');
      setError(err.response?.data?.message || 'Order failed during Saga execution.');
    }
  };

  return (
    <div className="container">
      <header className="animate-fade-in">
        <h1>CloudRetail</h1>
        <p className="subtitle">Microservices • Saga Pattern • High Performance</p>
      </header>

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
              <button 
                className="buy-btn" 
                onClick={() => handleBuy(product)}
                disabled={sagaStatus === 'creating'}
              >
                {sagaStatus === 'creating' ? <Loader2 className="animate-spin" style={{ margin: '0 auto' }} /> : 'Buy Now'}
              </button>
            </div>
          ))}
        </div>
      )}

      {sagaStatus !== 'idle' && (
        <div className="glass saga-tracker animate-fade-in">
          <div className="saga-header">
            <h3>Saga Transaction Status</h3>
            <span style={{ 
              padding: '4px 12px', 
              borderRadius: '20px', 
              fontSize: '0.8rem',
              background: sagaStatus === 'completed' ? '#10b981' : sagaStatus === 'failed' ? '#ef4444' : '#6366f1'
            }}>
              {sagaStatus.replace('_', ' ').toUpperCase()}
            </span>
          </div>

          <div className="saga-steps">
            <div className={`step ${sagaStatus !== 'idle' ? 'completed' : ''}`}>
              <div className="step-circle"><ShoppingCart size={20} /></div>
              <div className="step-label">Order Created</div>
            </div>
            <div className={`step ${['inventory_reserved', 'payment_processing', 'completed'].includes(sagaStatus) || (sagaStatus === 'creating') ? 'active' : ''} ${['completed'].includes(sagaStatus) ? 'completed' : ''}`}>
              <div className="step-circle"><Package size={20} /></div>
              <div className="step-label">Stock Reserved</div>
            </div>
            <div className={`step ${['payment_processing', 'completed'].includes(sagaStatus) ? 'active' : ''} ${sagaStatus === 'completed' ? 'completed' : ''}`}>
              <div className="step-circle"><CreditCard size={20} /></div>
              <div className="step-label">Payment OK</div>
            </div>
            <div className={`step ${sagaStatus === 'completed' ? 'completed' : ''}`}>
              <div className="step-circle"><CheckCircle2 size={20} /></div>
              <div className="step-label">Confirmed</div>
            </div>
          </div>

          {sagaStatus === 'completed' && activeOrder?.id && (
            <div style={{ marginTop: '2rem', textAlign: 'center', color: '#10b981' }}>
              <ShieldCheck size={48} style={{ marginBottom: '1rem' }} />
              <h4>Order #{activeOrder.id.split('-')[0]} Success!</h4>
              <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>Distributed transaction completed across 3 microservices.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
