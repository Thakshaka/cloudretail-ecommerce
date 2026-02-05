import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from '../context/AuthContext';
import axios from 'axios';

// Mock axios
vi.mock('axios');

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should provide initial auth state', () => {
    const TestComponent = () => {
      const { user, token, loading } = useAuth();
      return (
        <div>
          <div data-testid="user">{user ? 'logged in' : 'logged out'}</div>
          <div data-testid="token">{token || 'no token'}</div>
          <div data-testid="loading">{loading ? 'loading' : 'ready'}</div>
        </div>
      );
    };

    render(
      <BrowserRouter>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByTestId('user')).toHaveTextContent('logged out');
    expect(screen.getByTestId('token')).toHaveTextContent('no token');
  });

  it('should login successfully', async () => {
    const mockResponse = {
      data: {
        token: 'test-token',
        user: { id: '1', email: 'test@example.com', firstName: 'Test' }
      }
    };

    axios.post.mockResolvedValue(mockResponse);

    const TestComponent = () => {
      const { login, user } = useAuth();
      
      const handleLogin = async () => {
        await login('test@example.com', 'password');
      };

      return (
        <div>
          <button onClick={handleLogin}>Login</button>
          <div data-testid="user">{user?.email || 'not logged in'}</div>
        </div>
      );
    };

    const { getByText } = render(
      <BrowserRouter>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </BrowserRouter>
    );

    const loginButton = getByText('Login');
    loginButton.click();

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('test@example.com');
    });

    expect(localStorage.getItem('token')).toBe('test-token');
  });

  it('should handle login failure', async () => {
    axios.post.mockRejectedValue({
      response: { data: { message: 'Invalid credentials' } }
    });

    const TestComponent = () => {
      const { login } = useAuth();
      const [error, setError] = React.useState('');
      
      const handleLogin = async () => {
        const result = await login('test@example.com', 'wrong-password');
        if (!result.success) {
          setError(result.error);
        }
      };

      return (
        <div>
          <button onClick={handleLogin}>Login</button>
          <div data-testid="error">{error}</div>
        </div>
      );
    };

    const { getByText } = render(
      <BrowserRouter>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </BrowserRouter>
    );

    const loginButton = getByText('Login');
    loginButton.click();

    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('Invalid credentials');
    });
  });

  it('should logout successfully', () => {
    localStorage.setItem('token', 'test-token');
    localStorage.setItem('user', JSON.stringify({ id: '1', email: 'test@example.com' }));

    const TestComponent = () => {
      const { logout, user } = useAuth();
      
      return (
        <div>
          <button onClick={logout}>Logout</button>
          <div data-testid="user">{user?.email || 'not logged in'}</div>
        </div>
      );
    };

    const { getByText } = render(
      <BrowserRouter>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </BrowserRouter>
    );

    const logoutButton = getByText('Logout');
    logoutButton.click();

    expect(screen.getByTestId('user')).toHaveTextContent('not logged in');
    expect(localStorage.getItem('token')).toBeNull();
  });
});
