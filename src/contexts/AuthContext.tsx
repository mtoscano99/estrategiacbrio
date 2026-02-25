import React, { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type UserRole = "coordenacao" | "lider_area" | null;

interface Profile {
  id: string;
  nome: string;
  email: string;
  area_id: string | null;
  avatar_url: string | null;
  cargo: string | null;
  data_nascimento: string | null;
  telefone: string | null;
  email_contato: string | null;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  role: UserRole;
  loading: boolean;
  needsRole: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshRole: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  isCoordination: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);
  const [roleChecked, setRoleChecked] = useState(false);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("id, nome, email, area_id, avatar_url, cargo, data_nascimento, telefone, email_contato")
      .eq("id", userId)
      .single();
    if (data) setProfile(data as any);
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  const fetchRole = async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .single();
    if (data) {
      setRole(data.role as UserRole);
    } else {
      setRole(null);
    }
    setRoleChecked(true);
  };

  const refreshRole = async () => {
    if (user) {
      await fetchRole(user.id);
    }
  };

  useEffect(() => {
    let initialSessionHandled = false;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          const userId = session.user.id;
          // Defer DB calls to next tick so Supabase client sets auth headers first
          setTimeout(() => {
            Promise.all([fetchProfile(userId), fetchRole(userId)]).then(() => {
              if (event === 'INITIAL_SESSION' || !initialSessionHandled) {
                initialSessionHandled = true;
                setLoading(false);
              }
            });
          }, 0);
        } else {
          setProfile(null);
          setRole(null);
          setRoleChecked(true);
          if (event === 'INITIAL_SESSION' || !initialSessionHandled) {
            initialSessionHandled = true;
            setLoading(false);
          }
        }
      }
    );

    // Fallback: if onAuthStateChange doesn't fire INITIAL_SESSION within 2s
    const timeout = setTimeout(() => {
      if (!initialSessionHandled) {
        initialSessionHandled = true;
        supabase.auth.getSession().then(({ data: { session } }) => {
          setSession(session);
          setUser(session?.user ?? null);
          if (session?.user) {
            fetchProfile(session.user.id);
            fetchRole(session.user.id);
          } else {
            setRoleChecked(true);
          }
          setLoading(false);
        });
      }
    }, 2000);

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const needsRole = !!session && roleChecked && !role;

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        role,
        loading,
        needsRole,
        signIn,
        signOut,
        refreshRole,
        refreshProfile,
        isCoordination: role === "coordenacao",
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
