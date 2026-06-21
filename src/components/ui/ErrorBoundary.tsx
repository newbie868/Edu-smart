import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error in Edu-Smart:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--bg-primary)',
          padding: '24px'
        }}>
          <div className="glass-panel" style={{
            maxWidth: '500px',
            width: '100%',
            padding: '32px',
            textAlign: 'center'
          }}>
            <h1 className="gradient-text" style={{ fontSize: '2rem', marginBottom: '16px' }}>Oops! Something Went Wrong</h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.95rem', lineHeight: '1.5' }}>
              Edu-Smart encountered a critical rendering error. The developer team has been notified.
            </p>
            {this.state.error && (
              <pre style={{
                background: 'var(--bg-tertiary)',
                padding: '16px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.8rem',
                textAlign: 'left',
                overflowX: 'auto',
                color: 'var(--danger)',
                marginBottom: '24px',
                border: '1px solid var(--border-color)'
              }}>
                {this.state.error.toString()}
              </pre>
            )}
            <button 
              className="btn btn-primary"
              onClick={() => window.location.reload()}
              style={{ width: '100%' }}
            >
              Refresh Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
export default ErrorBoundary;
