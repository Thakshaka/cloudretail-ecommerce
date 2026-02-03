import React from 'react';
import { useCart } from '../context/CartContext';
import { Trash2, Plus, Minus, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const CartPage = () => {
  const { cart, removeFromCart, updateQuantity, getCartTotal, clearCart } = useCart();

  if (cart.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <h2>Your Cart is Empty</h2>
        <p style={{ color: '#666', marginBottom: '2rem' }}>Looks like you haven't added anything yet.</p>
        <Link to="/" style={{ padding: '0.75rem 1.5rem', backgroundColor: '#646cff', color: 'white', textDecoration: 'none', borderRadius: '4px' }}>
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="cart-container" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '2rem' }}>Shopping Cart</h2>
      
      <div className="cart-items" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {cart.map(item => (
          <div key={item.id} className="glass" style={{ display: 'flex', alignItems: 'center', padding: '1rem', gap: '1rem' }}>
            <img 
              src={item.imageUrl || `https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=100`} 
              alt={item.name} 
              style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px' }} 
            />
            
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>{item.name}</h3>
              <div style={{ color: '#666' }}>${parseFloat(item.price).toFixed(2)}</div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button 
                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                style={{ padding: '0.25rem', border: '1px solid #ddd', borderRadius: '4px', background: 'none', cursor: 'pointer' }}
              >
                <Minus size={16} />
              </button>
              <span style={{ width: '30px', textAlign: 'center' }}>{item.quantity}</span>
              <button 
                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                style={{ padding: '0.25rem', border: '1px solid #ddd', borderRadius: '4px', background: 'none', cursor: 'pointer' }}
              >
                <Plus size={16} />
              </button>
            </div>

            <div style={{ fontWeight: 'bold', width: '80px', textAlign: 'right' }}>
              ${(item.price * item.quantity).toFixed(2)}
            </div>

            <button 
              onClick={() => removeFromCart(item.id)}
              style={{ padding: '0.5rem', marginLeft: '1rem', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <Trash2 size={20} />
            </button>
          </div>
        ))}
      </div>

      <div className="cart-summary" style={{ marginTop: '2rem', textAlign: 'right' }}>
        <div style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
          Total: ${getCartTotal().toFixed(2)}
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <button 
            onClick={clearCart} 
            style={{ padding: '0.75rem 1.5rem', border: '1px solid #ddd', background: 'white', borderRadius: '4px', cursor: 'pointer' }}
          >
            Clear Cart
          </button>
          <Link 
            to="/checkout" 
            style={{ 
              padding: '0.75rem 2rem', 
              backgroundColor: '#646cff', 
              color: 'white', 
              textDecoration: 'none', 
              borderRadius: '4px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            Proceed to Checkout <ArrowRight size={20} />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
