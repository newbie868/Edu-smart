import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

interface PageContainerProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  children: React.ReactNode;
}

export const PageContainer: React.FC<PageContainerProps> = ({ 
  currentTab, 
  setCurrentTab, 
  children 
}) => {
  return (
    <div className="dashboard-layout" style={{ display: 'flex', minHeight: '100vh', overflow: 'hidden' }}>
      {/* Sidebar navigation */}
      <Sidebar currentTab={currentTab} setCurrentTab={setCurrentTab} />

      {/* Main container */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflow: 'hidden'
      }}>
        {/* Top Header */}
        <div style={{ padding: '0 24px', flexShrink: 0 }}>
          <Header title={currentTab} />
        </div>

        {/* Scrollable Content Workspace */}
        <main style={{
          flex: 1,
          padding: '0 24px 24px 24px',
          overflowY: 'auto'
        }}>
          <div className="animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
export default PageContainer;
