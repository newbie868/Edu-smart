import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogIn, Shield, Compass, BookOpen, Star } from 'lucide-react';

export const Login: React.FC = () => {
  const { loginWithGoogle, error, loading } = useAuth();

  const handleGoogleLogin = () => {
    loginWithGoogle();
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at top, rgba(99, 102, 241, 0.15), transparent), radial-gradient(ellipse at bottom, rgba(14, 165, 233, 0.1), transparent), var(--bg-primary)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '40px 24px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Decorative background grid pattern */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'radial-gradient(var(--border-color) 1px, transparent 0)',
        backgroundSize: '24px 24px',
        opacity: 0.25,
        pointerEvents: 'none',
        zIndex: 0
      }} />

      {/* Main Grid Wrapper */}
      <div className="animate-fade-in" style={{
        width: '100%',
        maxWidth: '1080px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '40px',
        alignItems: 'center',
        zIndex: 1
      }}>
        {/* Left Side: Product Intro */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, var(--primary), var(--info))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 'bold',
              fontSize: '1.5rem',
              boxShadow: '0 8px 16px rgba(99, 102, 241, 0.3)'
            }}>E</div>
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '2.5rem',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              margin: 0
            }} className="gradient-text">Edu-Smart</h1>
          </div>
          
          <h2 style={{
            fontSize: '1.75rem',
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            lineHeight: 1.25,
            color: 'var(--text-primary)'
          }}>
            The Secure, Multi-Tenant Academic OS for Modern Schools
          </h2>
          
          <p style={{
            fontSize: '1rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.6
          }}>
            Edu-Smart provides robust multi-tenant security, beautiful role-specific dashboards, and a comprehensive suite of academic tools including attendance grids, homework management, grades recording, and notices.
          </p>

          {/* Features bullet grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px',
            marginTop: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Shield size={20} style={{ color: 'var(--primary)', flexShrink: 0 }} />
              <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-primary)' }}>Data Isolation</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Compass size={20} style={{ color: 'var(--info)', flexShrink: 0 }} />
              <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-primary)' }}>Role Dashboards</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <BookOpen size={20} style={{ color: 'var(--success)', flexShrink: 0 }} />
              <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-primary)' }}>Academic Modules</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Star size={20} style={{ color: 'var(--warning)', flexShrink: 0 }} />
              <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-primary)' }}>Premium Billing</span>
            </div>
          </div>
        </div>

        {/* Right Side: Login Panel */}
        <div className="glass-panel" style={{
          padding: '40px',
          boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.1)',
          background: 'var(--glass-bg)',
          border: '1px solid var(--glass-border)'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h3 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.5rem',
              fontWeight: 700,
              marginBottom: '8px'
            }}>Get Started</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Sign in with Google to enter your school workspace.
            </p>
          </div>

          {error && (
            <div style={{
              padding: '12px 16px',
              background: 'var(--danger-light)',
              border: '1px solid var(--danger)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--danger)',
              fontSize: '0.85rem',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <Shield size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Real Google Auth Action */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="btn btn-primary"
            style={{
              width: '100%',
              padding: '14px',
              fontSize: '1rem',
              fontWeight: 600,
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px'
            }}
          >
            <LogIn size={20} />
            <span>{loading ? 'Authenticating...' : 'Sign In with Google'}</span>
          </button>


          <div style={{ textAlign: 'center', marginTop: '24px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Edu-Smart v2.0 • Data isolated at query-level
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Login;
