import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, LogOut, User, LogIn, Package } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { getCartCount } = useCart();
  const navigate = useNavigate();
  const cartCount = getCartCount();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="glass" style={{ margin: '0 0 2rem 0', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Link to="/" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem' }}>CloudRetail</h1>
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <Link to="/cart" style={{ textDecoration: 'none', color: 'inherit', position: 'relative', display: 'flex', alignItems: 'center' }}>
            <ShoppingCart size={24} />
            {cartCount > 0 && (
                <span style={{ 
                    position: 'absolute', 
                    top: '-8px', 
                    right: '-8px', 
                    backgroundColor: '#ef4444', 
                    color: 'white', 
                    borderRadius: '50%', 
                    width: '18px', 
                    height: '18px', 
                    fontSize: '12px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center' 
                }}>
                    {cartCount}
                </span>
            )}
        </Link>
      
        {user ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <User size={20} />
              <span>Hi, {user.firstName}</span>
            </div>
            <Link to="/orders" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '0.5rem', marginRight: '1rem' }}>
              <Package size={20} />
              My Orders
            </Link>
            <button 
              onClick={handleLogout}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <LogOut size={20} />
              Logout
            </button>
          </>
        ) : (
          <div style={{ display: 'flex', gap: '1rem' }}>
            <Link to="/login" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <LogIn size={20} />
              Login
            </Link>
            <Link to="/register" style={{ textDecoration: 'none', color: 'inherit', padding: '0.5rem 1rem', backgroundColor: '#646cff', borderRadius: '4px' }}>
              Register
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
