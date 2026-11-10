import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

import { supabase } from '@/lib/supabase';
import type { Module } from '@/lib/types';
import { useAuth } from '@/providers/AuthProvider';

type ModulesState = {
  /** null tant que l'utilisateur n'a pas composé son app. */
  modules: Module[] | null;
  loading: boolean;
  has: (m: Module) => boolean;
  save: (next: Module[]) => Promise<string | null>;
};

const ModulesContext = createContext<ModulesState>({
  modules: null,
  loading: true,
  has: () => false,
  save: async () => null,
});

/** Modules choisis par l'utilisateur connecté (stockés dans son profil, synchronisés entre appareils). */
export function ModulesProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user.id;
  // L'état est rattaché à l'utilisateur pour lequel il a été chargé : changer de compte invalide tout seul.
  const [state, setState] = useState<{ userId: string; modules: Module[] | null } | null>(null);
  const loaded = !!userId && state?.userId === userId;
  const modules = loaded ? state.modules : null;
  const loading = !!userId && !loaded;

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    supabase
      .from('profiles')
      .select('modules')
      .eq('id', userId)
      .single()
      .then(({ data }) => {
        if (!cancelled) setState({ userId, modules: (data?.modules as Module[] | null) ?? null });
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const save = useCallback(
    async (next: Module[]) => {
      if (!userId || next.length === 0) return 'Choisis au moins un module.';
      const { error } = await supabase.from('profiles').update({ modules: next }).eq('id', userId);
      if (error) return error.message;
      setState({ userId, modules: next });
      return null;
    },
    [userId],
  );

  const has = useCallback((m: Module) => !!modules?.includes(m), [modules]);

  return <ModulesContext.Provider value={{ modules, loading, has, save }}>{children}</ModulesContext.Provider>;
}

export const useModules = () => useContext(ModulesContext);
