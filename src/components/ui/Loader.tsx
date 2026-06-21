import React from 'react';

interface LoaderProps {
  fullPage?: boolean;
  message?: string;
}

export const Loader: React.FC<LoaderProps> = ({ fullPage = false, message = "Loading Edu-Smart..." }) => {
  const content = (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      gap: '16px'
    }}>
      <div style={{
        width: '48px',
        height: '48px',
        borderRadius: '50%',
        border: '3px solid var(--primary-light)',
        borderTopColor: 'var(--primary)',
        animation: 'spin 1s cubic-bezier(0.55, 0.15, 0.45, 0.85) infinite'
      }} />
      <p style={{
        color: 'var(--text-secondary)',
        fontFamily: 'var(--font-display)',
        fontWeight: 500,
        fontSize: '0.95rem'
      }}>{message}</p>
      
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );

  if (fullPage) {
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'var(--bg-primary)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {content}
      </div>
    );
  }

  return content;
};
export default Loader;
