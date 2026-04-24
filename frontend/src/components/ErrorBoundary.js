import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh',
          padding: '2rem'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '0.75rem',
            padding: '2.5rem',
            maxWidth: '500px',
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>Something went wrong</div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem', color: '#1F2937' }}>
              An unexpected error occurred
            </h2>
            <p style={{ color: '#6B7280', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              Please try again or return to the dashboard.
            </p>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <pre style={{
                background: '#FEF2F2',
                color: '#DC2626',
                padding: '1rem',
                borderRadius: '0.5rem',
                fontSize: '0.75rem',
                textAlign: 'left',
                overflow: 'auto',
                maxHeight: '150px',
                marginBottom: '1.5rem'
              }}>
                {this.state.error.toString()}
              </pre>
            )}
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                className="btn btn-secondary"
                onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
              >
                Try Again
              </button>
              <button
                className="btn btn-primary"
                onClick={() => { window.location.href = '/'; }}
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
