import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { onAuthStateChanged, signOut as firebaseSignOut, sendPasswordResetEmail, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import type { EmpresaPerfilDTO } from "@/features/configuracion/perfil/types";

const API_URL = import.meta.env.VITE_API_URL;

interface DbRole {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  activo: boolean;
}

interface DbUser {
  id: number;
  firebaseUid: string;
  email: string;
  nombre?: string;
  ruc?: string;
  razonSocial?: string;
  rol?: DbRole;
  activo?: boolean;
}

interface AuthContextType {
  user: User | null;
  dbUser: DbUser | null;
  setDbUser: (user: DbUser | null) => void;
  empresaPerfil: EmpresaPerfilDTO | null;
  setEmpresaPerfil: (perfil: EmpresaPerfilDTO | null) => void;
  loading: boolean;
  sessionReady: boolean;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  saveTempData: (key: string, data: unknown) => void;
  getTempData: (key: string) => unknown;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function fetchJsonWithToken<T>(url: string, token: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Solicitud rechazada por el servidor: ${response.status}`);
  }

  return response.json();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [dbUser, setDbUser] = useState<DbUser | null>(null);
  const [empresaPerfil, setEmpresaPerfil] = useState<EmpresaPerfilDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);
      setUser(currentUser);
      setDbUser(null);
      setEmpresaPerfil(null);

      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        const token = await currentUser.getIdToken();
        const data = await fetchJsonWithToken<DbUser>(
          `${API_URL}/api/usuarios/firebase/${currentUser.uid}`,
          token
        );

        setDbUser(data);

        try {
          const perfilData = await fetchJsonWithToken<EmpresaPerfilDTO>(
            `${API_URL}/api/empresa-configuracion/usuario/${data.id}`,
            token
          );
          setEmpresaPerfil(perfilData);
        } catch {
          setEmpresaPerfil(null);
        }
      } catch {
        await firebaseSignOut(auth);
        setUser(null);
        setDbUser(null);
        setEmpresaPerfil(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signOut = async () => {
    await firebaseSignOut(auth);
    setUser(null);
    setDbUser(null);
    setEmpresaPerfil(null);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email, {
      url: `${window.location.origin}/reset-password`,
      handleCodeInApp: false,
    });
  };

  const saveTempData = (key: string, data: unknown) => {
    if (!user) {
      localStorage.setItem(`erp_temp_${key}`, JSON.stringify(data));
    }
  };

  const getTempData = (key: string) => {
    const item = localStorage.getItem(`erp_temp_${key}`);
    try {
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  };

  const value: AuthContextType = {
    user,
    dbUser,
    setDbUser,
    empresaPerfil,
    setEmpresaPerfil,
    loading,
    sessionReady: Boolean(user && dbUser),
    signOut,
    resetPassword,
    saveTempData,
    getTempData,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth debe usarse dentro de un AuthProvider");
  }
  return context;
}

