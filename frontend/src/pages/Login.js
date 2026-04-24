import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);

    if (result.success) {
      navigate('/');
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  const fillDemoCredentials = () => {
    setEmail('demo@example.com');
    setPassword('password123');
  };

  const fillAdminCredentials = () => {
    setEmail('admin@knowledgebase.com');
    setPassword('password123');
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <h1>📚 Knowledge Base</h1>
          <p>AI-Powered Wiki Generator</p>
        </div>

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="login-footer">
          <p style={{ marginBottom: '1rem', fontSize: '0.875rem', color: '#6B7280' }}>
            Quick Login Options
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginBottom: '1rem' }}>
            <button type="button" className="demo-btn" onClick={fillDemoCredentials}>
              Demo User
            </button>
            <button type="button" className="demo-btn" onClick={fillAdminCredentials}>
              Admin User
            </button>
          </div>
          <p style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '0.75rem' }}>
            <Link to="/forgot-password" style={{ color: '#3B82F6', textDecoration: 'none', fontWeight: 500 }}>
              Forgot Password?
            </Link>
          </p>
          <p style={{ fontSize: '0.875rem', color: '#6B7280' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: '#3B82F6', textDecoration: 'none', fontWeight: 500 }}>
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
