'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Evento, Perfil } from '@/lib/types/database';
import { eventService } from '@/lib/services/eventService';
import { supabase } from '@/lib/supabase';

interface EventContextType {
  currentEvent: Evento | null;
  events: Evento[];
  setCurrentEvent: (event: Evento | null) => void;
  loading: boolean;
  userProfile: Perfil | null;
  refreshEvents: () => Promise<void>;
}

const EventContext = createContext<EventContextType | undefined>(undefined);

export function EventProvider({ children }: { children: React.ReactNode }) {
  const [currentEvent, setCurrentEvent] = useState<Evento | null>(null);
  const [events, setEvents] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<Perfil | null>(null);

  const fetchData = async () => {
    setLoading(true);
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) {
      setLoading(false);
      return;
    }

    // 1. Perfil
    try {
      const { data: profile, error: profileError } = await supabase.from('perfis').select('*').eq('id', user.id).maybeSingle();
      if (profileError) console.error('[EventContext] Erro ao carregar perfil:', profileError);
      setUserProfile(profile);
    } catch (e) {
      console.error('[EventContext] Falha crítica ao carregar perfil:', e);
    }

    // 2. Eventos
    try {
      const myEvents = await eventService.getMyEvents();
      setEvents(myEvents);

      // 3. Selecionar evento atual (Persistir no localStorage ou pegar o primeiro)
      const savedEventId = localStorage.getItem('last_event_id');
      if (savedEventId) {
        const found = myEvents.find(e => e.id === savedEventId);
        if (found) {
          setCurrentEvent(found);
        } else {
          setCurrentEvent(myEvents[0] || null);
        }
      } else {
        setCurrentEvent(myEvents[0] || null);
      }
    } catch (e) {
      console.error('[EventContext] Erro ao carregar eventos:', e);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (currentEvent) {
      localStorage.setItem('last_event_id', currentEvent.id);
    }
  }, [currentEvent]);

  return (
    <EventContext.Provider value={{ 
      currentEvent, 
      events, 
      setCurrentEvent, 
      loading, 
      userProfile,
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
