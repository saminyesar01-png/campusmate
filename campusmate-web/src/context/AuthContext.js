import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else setLoading(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) await fetchProfile(session.user.id);
        else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId) {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*, departments(name, code)')
      .eq('id', userId)
      .single();

    if (!error) setProfile(data);
    setLoading(false);
  }

  async function signUp({ email, password, fullName, role, studentId, departmentId }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role, student_id: studentId }
      }
    });

    if (!error && data.user) {
      // Validate UUID format before inserting department_id
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(departmentId);
      await supabase.from('profiles').update({
        student_id: studentId || null,
        department_id: isUUID ? departmentId : null
      }).eq('id', data.user.id);
    }

    return { data, error };
  }

  async function signIn({ email, password }) {
    return await supabase.auth.signInWithPassword({ email, password });
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  }

  const value = {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    isStudent: profile?.role === 'student',
    isTeacher: profile?.role === 'teacher',
    isAdmin: profile?.role === 'admin',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
