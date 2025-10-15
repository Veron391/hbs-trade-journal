"use client";

import { createContext, useContext, useState, ReactNode } from 'react';

interface FormContextType {
  isTradeFormOpen: boolean;
  setIsTradeFormOpen: (isOpen: boolean) => void;
}

const FormContext = createContext<FormContextType | undefined>(undefined);

export function FormProvider({ children }: { children: ReactNode }) {
  const [isTradeFormOpen, setIsTradeFormOpen] = useState(false);

  return (
    <FormContext.Provider value={{ isTradeFormOpen, setIsTradeFormOpen }}>
      {children}
    </FormContext.Provider>
  );
}

export function useFormContext() {
  const context = useContext(FormContext);
  if (context === undefined) {
    throw new Error('useFormContext must be used within a FormProvider');
  }
  return context;
}
