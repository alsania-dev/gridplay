/**
 * GridPlay Header Component
 * 
 * Top navigation bar with logo, nav links, and auth buttons.
 * Mobile responsive with hamburger menu.
 */

import React, { useState } from 'react';
import Button from './Button';

export interface NavItem {
  label: string;
  href: string;
}

export interface HeaderProps {
  /** Navigation items */
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
  /** Additional CSS classes */
  className?: string;
}

const defaultNavItems: NavItem[] = [
  { label: 'Games', href: '/games' },
  { label: 'How It Works', href: '/how-it-works' },
  { label: 'Leaderboard', href: '/leaderboard' },
];

const MenuIcon: React.FC = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const CloseIcon: React.FC = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

export const Header: React.FC<HeaderProps> = ({
  navItems = defaultNavItems,
  isAuthenticated = false,
  userName,
  userAvatar,
  onLogin,
  onSignup,
  onLogout,
  className = '',
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <header className={`bg-[#0A0A0A] border-b border-[#374151] sticky top-0 z-50 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2 flex-shrink-0">
            <img
              src="/logo-icon.svg"
              alt="GridPlay"
              className="h-8 w-8"
            />
            <span className="text-white font-bold text-lg hidden sm:block">
              Grid<span className="text-[#F59E0B]">Play</span>
            </span>
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-[#9CA3AF] hover:text-white text-sm font-medium transition-colors"
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {userAvatar ? (
                    <img
                      src={userAvatar}
                      alt={userName || 'User'}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-[#1E3A5A] flex items-center justify-center text-white text-sm font-medium">
                      {userName?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                  <span className="text-white text-sm font-medium">
                    {userName}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onLogout}
                >
                  Logout
                </Button>
              </div>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onLogin}
                >
                  Log In
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={onSignup}
                >
                  Sign Up
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-[#9CA3AF] hover:text-white transition-colors"
            onClick={toggleMobileMenu}
            aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-[#0A0A0A] border-b border-[#374151] animate-slide-down">
          <div className="px-4 py-4 space-y-4">
            {/* Mobile Navigation */}
            <nav className="space-y-2">
              {navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="block text-[#9CA3AF] hover:text-white text-base font-medium py-2 transition-colors"
                  onClick={closeMobileMenu}
                >
                  {item.label}
                </a>
              ))}
            </nav>

            {/* Mobile Auth Buttons */}
            <div className="pt-4 border-t border-[#374151] space-y-2">
              {isAuthenticated ? (
                <>
                  <div className="flex items-center gap-2 py-2">
                    {userAvatar ? (
                      <img
                        src={userAvatar}
                        alt={userName || 'User'}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-[#1E3A5A] flex items-center justify-center text-white text-sm font-medium">
                        {userName?.charAt(0).toUpperCase() || 'U'}
                      </div>
                    )}
                    <span className="text-white text-base font-medium">
                      {userName}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    fullWidth
                    onClick={() => {
                      onLogout?.();
                      closeMobileMenu();
                    }}
                  >
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    fullWidth
                    onClick={() => {
                      onLogin?.();
                      closeMobileMenu();
                    }}
                  >
                    Log In
                  </Button>
                  <Button
                    variant="primary"
                    fullWidth
                    onClick={() => {
                      onSignup?.();
                      closeMobileMenu();
                    }}
                  >
                    Sign Up
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
