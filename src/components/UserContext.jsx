import React, { createContext, useState, useEffect } from "react";
import { supabase } from "../supabaseClient"; // Doğru path!

export const UserContext = createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);

  // Oturum değişikliklerini dinle
  useEffect(() => {
    // İlk yüklemede mevcut oturumu çek
    const session = supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user);
      }
    });

    // Oturum değişikliği dinleyicisi ekle
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    // Temizlik
    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
}