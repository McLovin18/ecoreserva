'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { v4 as uuidv4 } from "uuid";
import { apiFetch } from '../utils/apiClient';

type AppRole = 'admin' | 'owner' | 'client';

interface AuthUser {
  id: number;
  email: string;
  nombre?: string;
  apellido?: string;
  displayName?: string;
  role?: AppRole;
}

interface UserData {
  email: string;
  role?: AppRole;
  displayName?: string;
  owner?: boolean;
  ownedPropertyIds?: number[];
}

interface AuthContextType {
  user: AuthUser | null;
  userData: UserData | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string, role?: 'owner' | 'client') => Promise<void>;
  logout: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  updateUserProfile: (displayName?: string, photoURL?: string) => Promise<void>;
  isOwner: boolean;
  anonymousId: string | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};


export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [justRegistered, setJustRegistered] = useState(false);
  const [anonymousId, setAnonymousId] = useState<string | null>(null);
  


  // Cargar usuario desde el backend (Node + SQL) usando el token guardado
  useEffect(() => {
    const bootstrapAuth = async () => {
      setLoading(true);
      try {
        const storedUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
        const storedToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

        if (!storedToken) {
          setUser(null);
          setUserData(null);
          setLoading(false);
          return;
        }

        // Validar token y obtener usuario actual
        const me = await apiFetch<{
          id: number;
          nombre?: string;
          apellido?: string;
          email: string;
          role: AppRole;
        }>('/api/auth/me', {
          method: 'GET',
        });

        const authUser: AuthUser = {
          id: me.id,
          email: me.email,
          nombre: me.nombre,
          apellido: me.apellido,
          displayName: me.nombre,
          role: me.role,
        };

        let data: UserData = {
          email: me.email,
          displayName: me.nombre,
          role: me.role,
          owner: me.role === 'owner',
        };

        if (storedUser) {
          try {
            const parsed = JSON.parse(storedUser);
            data = { ...data, ...parsed };
          } catch {
            // ignore parse error
          }
        }

        localStorage.setItem('user', JSON.stringify(data));
        setUser(authUser as any);
        setUserData(data);
      } catch (error) {
        console.log('No se pudo cargar sesión desde backend, limpiando token', error);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
        setUser(null);
        setUserData(null);
      } finally {
        setLoading(false);
      }
    };

    bootstrapAuth();
  }, []);

  useEffect(() => {
    if (!user) {
      let anon = localStorage.getItem('anonymousId');
      if (!anon) {
        anon = uuidv4();
        localStorage.setItem('anonymousId', anon);
      }
      setAnonymousId(anon);
    }
  }, [user]);

  const register = async (email: string, password: string, name?: string, role: 'owner' | 'client' = 'client') => {
    const normalizedEmail = email.toLowerCase();

    try {
      await apiFetch('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          nombre: name || normalizedEmail.split('@')[0],
          apellido: '',
          correo: normalizedEmail,
          password,
          telefono: null,
          role,
        }),
      });

      setJustRegistered(true);
    } catch (error: any) {
      // Propagar error con code para que el UI lo maneje igual que antes
      const err: any = new Error(error.message || 'Error al registrar usuario');
      if (error.code) err.code = error.code;
      throw err;
    }
  };




  const login = async (email: string, password: string) => {
    const normalizedEmail = email.toLowerCase();

    try {
      const data = await apiFetch<{
        token: string;
        user: { id: number; nombre?: string; apellido?: string; email: string; role: AppRole };
      }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ correo: normalizedEmail, password }),
      });

      if (typeof window !== 'undefined') {
        localStorage.setItem('token', data.token);
      }

      const authUser: AuthUser = {
        id: data.user.id,
        email: data.user.email,
        nombre: data.user.nombre,
        apellido: data.user.apellido,
        displayName: data.user.nombre,
        role: data.user.role,
      };

      const newUserData: UserData = {
        email: data.user.email,
        displayName: data.user.nombre,
        role: data.user.role,
        owner: data.user.role === 'owner',
      };

      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(newUserData));
      }

      setUser(authUser as any);
      setUserData(newUserData);
    } catch (error: any) {
      const err: any = new Error(error.message || 'Error al iniciar sesión');
      if (error.code) err.code = error.code;
      throw err;
    }
  };





  const logout = async () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('favourites_temp');
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    }
    setUser(null as any);
    setUserData(null);
  };

  const loginWithGoogle = () => {
    const error: any = new Error('El inicio de sesión con Google ya no está disponible.');
    error.code = 'auth/google-disabled';
    return Promise.reject(error);
  };

  const updateUserProfile = async (displayName?: string, photoURL?: string) => {
    if (!user) throw new Error('Usuario no autenticado');

    // Por ahora, solo actualizamos en el estado/localStorage.
    const updatedUser: AuthUser = {
      ...user,
      displayName: displayName ?? user.displayName,
    };
    setUser(updatedUser as any);

    if (userData) {
      const updatedUserData: UserData = {
        ...userData,
        displayName: displayName ?? userData.displayName,
      };
      setUserData(updatedUserData);
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(updatedUserData));
      }
    }
  };

  const isOwner = userData?.role === 'owner' || userData?.owner === true;

  return (
    <AuthContext.Provider value={{ 
      user, 
      userData, 
      loading, 
      login, 
      register, 
      logout, 
      loginWithGoogle, 
      updateUserProfile,
      isOwner,
      anonymousId
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
