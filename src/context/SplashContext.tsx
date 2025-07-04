import React, { createContext, useContext, useState } from 'react';

interface SplashContextProps {
  isSplashComplete: boolean;
  setSplashComplete: (value: boolean) => void;
}

// Default context value
const defaultContextValue: SplashContextProps = {
  isSplashComplete: false,
  setSplashComplete: () => {},
};

// Create context
const SplashContext = createContext<SplashContextProps>(defaultContextValue);

// Provider component
export const SplashProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [isSplashComplete, setSplashComplete] = useState(false);
  
  return (
    <SplashContext.Provider value={{ isSplashComplete, setSplashComplete }}>
      {children}
    </SplashContext.Provider>
  );
};

// Custom hook for using the splash context
export const useSplash = () => useContext(SplashContext);
