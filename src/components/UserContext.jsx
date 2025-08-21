import React, { createContext, useState, useEffect } from "react";
import { supabase } from "../supabaseClient"; 

export const UserContext = createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);

  
  useEffect(() => {
    
    const session = supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user);
      }
    });

    
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    
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