/**
 * GridPlay Layout Component
 * 
 * Main layout wrapper with responsive navigation, header, and footer.
 */

import React from 'react';
import Header, { NavItem } from './Header';
import Footer from './Footer';

export interface LayoutProps {
  /** Page content */
  children: React.ReactNode;
  /** Navigation items for header */
  navItems?: NavItem[];
  /** Whether user is authenticated */
  isAuthenticated?: boolean;
  /** User display name (when authenticated) */
  userName?: string;
  /** User avatar URL (when authenticated) */
  userAvatar?: string;
  /** Callback when login is clicked */
  onLogin?: () => void;
  /** Callback when signup is clicked */
  onSignup?: () => void;
  /** Callback when logout is clicked */
  onLogout?: () => void;
  /** Whether to show footer */
  showFooter?: boolean;
  /** Whether to show header */
  showHeader?: boolean;
  /** Additional CSS classes for main content */
  className?: string;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  navItems,
  isAuthenticated = false,
  userName,
  userAvatar,
  onLogin,
  onSignup,
  onLogout,
  showFooter = true,
  showHeader = true,
  className = '',
}) => {
  return (
    <div className="min-h-screen flex flex-col bg-[#0A0A0A]">
      {/* Header */}
      {showHeader && (
        <Header
          navItems={navItems}
          isAuthenticated={isAuthenticated}
          userName={userName}
          userAvatar={userAvatar}
          onLogin={onLogin}
          onSignup={onSignup}
          onLogout={onLogout}
        />
      )}

      {/* Main Content */}
      <main className={`flex-1 ${className}`}>
        {children}
      </main>

      {/* Footer */}
      {showFooter && <Footer />}
    </div>
  );
};

export default Layout;
