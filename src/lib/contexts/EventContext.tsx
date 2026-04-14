'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Evento, Perfil } from '@/lib/types/database';
import { eventService } from '@/lib/services/eventService';
import { supabase } from '@/lib/supabase';

import { AuthChangeEvent, Session } from '@supabase/supabase-js';

interface EventContextType {
  currentEvent: Evento | null;
  events: Evento[];
  setCurrentEvent: (event: Evento | null) => void;
  loading: boolean;
  userProfile: Perfil | null;
  userRole: 'owner' | 'organizador' | null;
  refreshEvents: () => Promise<void>;
}

const EventContext = createContext<EventContextType | undefined>(undefined);

export function EventProvider({ children }: { children: React.ReactNode }) {
  const [currentEvent, setCurrentEvent] = useState<Evento | null>(null);
  const [events, setEvents] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<Perfil | null>(null);
  const [userRole, setUserRole] = useState<'owner' | 'organizador' | null>(null);

  const fetchData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // 1. Perfil
      const { data: profile } = await supabase.from('perfis').select('*').eq('id', user.id).maybeSingle();
      setUserProfile(profile);

      // 2. Eventos
      const myEvents = await eventService.getMyEvents();
      setEvents(myEvents);

      // 3. Selecionar evento atual (Prioridade: salvo > primeiro disponível)
      const savedEventId = localStorage.getItem('last_event_id');
      const foundEvent = savedEventId ? myEvents.find(e => e.id === savedEventId) : null;
      const finalEvent = foundEvent || (myEvents.length > 0 ? myEvents[0] : null);
      
      setCurrentEvent(finalEvent);
      
      if (finalEvent && !savedEventId) {
        localStorage.setItem('last_event_id', finalEvent.id);
      }

      // 4. Papel do Usuário (Busca imediata para evitar race conditions)
      if (finalEvent && profile) {
        if (profile.is_master) {
          setUserRole('owner');
        } else {
          const { data } = await supabase
            .from('evento_organizadores')
            .select('role')
            .eq('evento_id', finalEvent.id)
            .eq('user_id', profile.id)
            .maybeSingle();
          setUserRole(data?.role || null);
        }
      } else {
        setUserRole(null);
      }
    } catch (e) {
      console.error('[EventContext] Erro ao carregar dados:', e);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    fetchData();

    // Sincronização automática com estado de login (essencial para cadastro PLG)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: AuthChangeEvent) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        fetchData();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Persistência do evento selecionado
  useEffect(() => {
    if (currentEvent) localStorage.setItem('last_event_id', currentEvent.id);
  }, [currentEvent]);

  return (
    <EventContext.Provider value={{ 
      currentEvent, 
      events, 
      setCurrentEvent, 
      loading, 
      userProfile,
      userRole,
      refreshEvents: fetchData
    }}>
      {children}
    </EventContext.Provider>
  );
}

export function useEvent() {
  const context = useContext(EventContext);
  if (context === undefined) {
    throw new Error('useEvent deve ser usado dentro de um EventProvider');
  }
  return context;
}
