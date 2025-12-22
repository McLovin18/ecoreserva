"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';

// Definir tipos de roles soportados en EcoReserva
export type UserRole = 'admin' | 'owner' | 'client';

interface RoleContextType {
  role: UserRole;
  isAdmin: boolean;
  isOwner: boolean;
  isClient: boolean;
  loading: boolean;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export const RoleProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [role, setRole] = useState<UserRole>('client');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUserRole = async () => {
      setLoading(true);
      const email = user?.email || undefined;

      try {
        // En el nuevo modelo, el rol viene directamente en userData (AuthContext)
        const stored = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (parsed.role === 'owner') {
              setRole('owner');
              setLoading(false);
              return;
            }
            if (parsed.role === 'admin') {
              setRole('admin');
              setLoading(false);
              return;
            }
          } catch (err) {
            console.log('Error parseando localStorage para rol:', err);
          }
        }

        // Si no hay información en localStorage, asumir cliente
        if (email) {
          console.log(`Rol por defecto para ${email}: client`);
        }
        setRole('client');
      } finally {
        setLoading(false);
      }
    };

    checkUserRole();
  }, [user]);

  const isAdmin = role === 'admin';
  const isOwner = role === 'owner';
  const isClient = role === 'client';

  return (
    <RoleContext.Provider value={{ role, isAdmin, isOwner, isClient, loading }}>
      {children}
    </RoleContext.Provider>
  );
};

export const useRole = () => {
  const context = useContext(RoleContext);
  if (context === undefined) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
};
