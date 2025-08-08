import React from 'react';
import { isAuthenticationEnabled, getAuthStatus } from '@/lib/auth';

/**
 * Development component to show current authentication status
 * This can be temporarily added to any page during development
 * Remove from production builds
 */
export const AuthStatusIndicator: React.FC = () => {
  if (process.env.NODE_ENV === 'production') {
    return null; // Don't show in production
  }

  const isEnabled = isAuthenticationEnabled();
  const status = getAuthStatus();

  return (
    <div 
      style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        backgroundColor: isEnabled ? '#d32f2f' : '#4caf50',
        color: 'white',
        padding: '8px 12px',
        borderRadius: '4px',
        fontSize: '12px',
        fontFamily: 'monospace',
        zIndex: 9999,
        border: '1px solid #ccc'
      }}
    >
      🔐 {status}
    </div>
  );
};

export default AuthStatusIndicator;
