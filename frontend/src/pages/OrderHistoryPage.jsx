import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Package, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

// API endpoints
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const OrderHistoryPage = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user?.id) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      const resp = await axios.get(`${API_BASE_URL}/api/v1/orders/user/${user.id}`);
      // Sort by newest first (assuming createdAt exists or just by ID if chronological)
      // The API might return { orders: [...] } or just [...]
      const ordersList = resp.data.orders || resp.data || [];
      // Primitive sort if dates are strings
      ordersList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      setOrders(ordersList);
      setLoading(false);
    } catch (err) {
      console.error('Fetch orders error:', err);
      setError('Failed to load order history.');
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#10b981'; // Green
      case 'failed': return '#ef4444'; // Red
      case 'cancelled': return '#f59e0b'; // Amber
      default: return '#6366f1'; // Indigo (processing)
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle2 size={16} />;
      case 'failed': return <XCircle size={16} />;
      case 'cancelled': return <AlertCircle size={16} />;
      default: return <Clock size={16} />;
    }
  };

  if (!user) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <p>Please <Link to="/login">login</Link> to view your orders.</p>
      </div>
    );
  }

  if (loading) {
     return <div style={{ textAlign: 'center', padding: '4rem' }}>Loading orders...</div>;
  }

  return (
    <div className="order-history-container" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '2rem' }}>Order History</h2>

      {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}

      {orders.length === 0 ? (
        <div className="glass" style={{ textAlign: 'center', padding: '3rem' }}>
          <Package size={48} style={{ color: '#ccc', marginBottom: '1rem' }} />
          <h3>No orders yet</h3>
          <p style={{ color: '#666', marginBottom: '2rem' }}>You haven't placed any orders yet.</p>
          <Link to="/" style={{ padding: '0.75rem 1.5rem', backgroundColor: '#646cff', color: 'white', textDecoration: 'none', borderRadius: '4px' }}>
            Start Shopping
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {orders.map(order => (
            <div key={order.id} className="glass" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>Order #{order.id}</div>
                  <div style={{ fontSize: '0.85rem', color: '#666' }}>
                    {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString()}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                   <div style={{ fontWeight: 'bold' }}>${parseFloat(order.totalAmount).toFixed(2)}</div>
                   <div style={{ 
                     display: 'inline-flex', 
                     alignItems: 'center', 
                     gap: '0.25rem',
                     fontSize: '0.85rem', 
                     color: 'white', 
                     backgroundColor: getStatusColor(order.status),
                     padding: '2px 8px',
                     borderRadius: '12px',
                     marginTop: '0.25rem'
                   }}>
                     {getStatusIcon(order.status)}
                     <span style={{ textTransform: 'uppercase' }}>{order.status}</span>
                   </div>
                </div>
              </div>

              {/* Items Summary (Assuming the API returns items, otherwise we skip) */}
              {order.items && (
                 <div style={{ fontSize: '0.9rem', color: '#444' }}>
                   {order.items.map((item, idx) => (
                     <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                       <span>{item.quantity} x Product ({item.productId.substring(0,8)}...)</span>
                       <span>${parseFloat(item.price).toFixed(2)}</span>
                     </div>
                   ))}
                 </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrderHistoryPage;
