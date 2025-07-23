
"use client";

import React, { createContext, useContext } from 'react';
import type { User } from '@supabase/supabase-js';

type UserContextType = {
  user: User | null;
};

const UserContext = createContext<UserContextType>({ user: null });

export const UserProvider = ({ children, user }: { children: React.ReactNode; user: User | null }) => {
  return (
    <UserContext.Provider value={{ user }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
