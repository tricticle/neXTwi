// src/components/LoadingSpinner.js
import React from 'react';

/**
 * Loading spinner component
 */
const LoadingSpinner = ({ size = 'medium', message = 'Loading...' }) => {
  const sizeMap = {
    small: '20px',
    medium: '40px',
    large: '60px',
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      gap: '12px',
    }}>
      <div style={{
        width: sizeMap[size],
        height: sizeMap[size],
        border: '4px solid #f0f0f0',
        borderTop: '4px solid #007bff',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
      }} />
      {message && <p style={{ color: '#666', margin: 0 }}>{message}</p>}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

/**
 * Skeleton loader for tweets
 */
export const TweetSkeleton = () => {
  return (
    <div style={{
      padding: '16px',
      borderBottom: '1px solid #efefef',
      animation: 'pulse 2s ease-in-out infinite',
    }}>
      <div style={{
        display: 'flex',
        gap: '12px',
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          backgroundColor: '#f0f0f0',
        }} />
        <div style={{ flex: 1 }}>
          <div style={{
            height: '20px',
            backgroundColor: '#f0f0f0',
            borderRadius: '4px',
            marginBottom: '8px',
            width: '150px',
          }} />
          <div style={{
            height: '16px',
            backgroundColor: '#f0f0f0',
            borderRadius: '4px',
            marginBottom: '8px',
          }} />
          <div style={{
            height: '16px',
            backgroundColor: '#f0f0f0',
            borderRadius: '4px',
            width: '80%',
          }} />
        </div>
      </div>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

/**
 * Error message component
 */
export const ErrorMessage = ({ message, onDismiss }) => {
  return (
    <div style={{
      backgroundColor: '#f8d7da',
      border: '1px solid #f5c6cb',
      borderRadius: '4px',
      padding: '12px 16px',
      color: '#721c24',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '16px',
    }}>
      <span>{message}</span>
      {onDismiss && (
        <button 
          onClick={onDismiss}
          style={{
            backgroundColor: 'transparent',
            border: 'none',
            color: '#721c24',
            cursor: 'pointer',
            fontSize: '20px',
          }}
        >
          ×
        </button>
      )}
    </div>
  );
};

/**
 * Success message component
 */
export const SuccessMessage = ({ message, onDismiss }) => {
  return (
    <div style={{
      backgroundColor: '#d4edda',
      border: '1px solid #c3e6cb',
      borderRadius: '4px',
      padding: '12px 16px',
      color: '#155724',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '16px',
    }}>
      <span>{message}</span>
      {onDismiss && (
        <button 
          onClick={onDismiss}
          style={{
            backgroundColor: 'transparent',
            border: 'none',
            color: '#155724',
            cursor: 'pointer',
            fontSize: '20px',
          }}
        >
          ×
        </button>
      )}
    </div>
  );
};

export default LoadingSpinner;
