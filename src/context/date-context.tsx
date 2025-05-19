import React, { createContext, useState, useContext } from 'react';
import { getTodayFormatted } from '../utils/date-utils';

interface DateContextType {
  selectedDate: string;
  setSelectedDate: (date: string) => void;
}

// Defaultwert für den Context
const defaultDateContext: DateContextType = {
  selectedDate: getTodayFormatted(),
  setSelectedDate: () => {}
};

// Context erstellen
export const DateContext = createContext<DateContextType>(defaultDateContext);

// Custom Hook für einfachen Zugriff auf den Context
export const useDateContext = () => useContext(DateContext);

// Provider-Komponente
export const DateProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [selectedDate, setSelectedDate] = useState<string>(getTodayFormatted());

  return (
    <DateContext.Provider value={{ selectedDate, setSelectedDate }}>
      {children}
    </DateContext.Provider>
  );
};
