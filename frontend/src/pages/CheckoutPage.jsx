import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Loader2, CheckCircle2 } from 'lucide-react';

// API endpoints
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const CheckoutPage = () => {
  const { user } = useAuth();
  const { cart, getCartTotal, clearCart } = useCart();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [orderId, setOrderId] = useState(null);

  const [address, setAddress] = useState({
    street: '',
    city: '',
    state: '',
    zip: '',
    country: ''
  });

  if (!user) {
      navigate('/login');
      return null;
  }

  if (cart.length === 0 && !success) {
      navigate('/');
      return null;
  }

  const handleAddressChange = (e) => {
    setAddress({
      ...address,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const orderPayload = {
      userId: user.id, // Assuming user object has id
      items: cart.map(item => ({
        productId: item.id,
        quantity: item.quantity,
        price: item.price
      })),
      shippingAddress: address
    };

    try {
      const resp = await axios.post(`${API_BASE_URL}/api/v1/orders`, orderPayload);
      setOrderId(resp.data.order.id);
      setSuccess(true);
      clearCart();
      setLoading(false);
    } catch (err) {
      console.error('Checkout error:', err);
      setError(err.response?.data?.message || 'Failed to place order. Please try again.');
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="checkout-success" style={{ textAlign: 'center', padding: '4rem', maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ color: '#10b981', marginBottom: '1rem' }}>
          <CheckCircle2 size={64} />
        </div>
        <h2>Order Placed Successfully!</h2>
        <p style={{ color: '#666', marginBottom: '2rem' }}>
          Thank you for your purchase. Your order ID is <strong>{orderId}</strong>.
        </p>
        <button 
          onClick={() => navigate('/')}
          style={{ padding: '0.75rem 1.5rem', backgroundColor: '#646cff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          Continue Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="checkout-container" style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', gap: '2rem' }}>
      <div style={{ flex: 2 }}>
        <h2 style={{ marginBottom: '1.5rem' }}>Checkout</h2>
        
        {error && (
          <div className="error-message" style={{ padding: '1rem', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '4px', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="glass" style={{ padding: '2rem' }}>
          <h3 style={{ marginTop: 0, marginBottom: '1.5rem' }}>Shipping Address</h3>
          
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Street Address</label>
            <input
              type="text"
              name="street"
              value={address.street}
              onChange={handleAddressChange}
              required
              style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ddd' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>City</label>
              <input
                type="text"
                name="city"
                value={address.city}
                onChange={handleAddressChange}
                required
                style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ddd' }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>State/Province</label>
              <input
                type="text"
                name="state"
                value={address.state}
                onChange={handleAddressChange}
                required
                style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ddd' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Postal Code</label>
              <input
                type="text"
                name="zip"
                value={address.zip}
                onChange={handleAddressChange}
                required
                style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ddd' }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Country</label>
              <input
                type="text"
                name="country"
                value={address.country}
                onChange={handleAddressChange}
                required
                style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ddd' }}
              />
            </div>
          </div>

          <h3 style={{ marginBottom: '1.5rem' }}>Payment Details</h3>
          <div style={{ padding: '1rem', backgroundColor: '#f3f4f6', borderRadius: '4px', marginBottom: '2rem', color: '#666' }}>
            Running in Simulation Mode. No real payment required.
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              width: '100%', 
              padding: '1rem', 
              backgroundColor: '#646cff', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px', 
              fontSize: '1.1rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            {loading ? <Loader2 className="animate-spin" /> : 'Place Order'}
          </button>
        </form>
      </div>

      <div style={{ flex: 1 }}>
        <div className="glass" style={{ padding: '1.5rem', position: 'sticky', top: '2rem' }}>
          <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Order Summary</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
            {cart.map(item => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                <span>{item.name} x {item.quantity}</span>
                <span>${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          
          <div style={{ borderTop: '1px solid #eee', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.1rem' }}>
            <span>Total</span>
            <span>${getCartTotal().toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
