import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import {
  subscribeToMonthEvents,
  subscribeToUpcomingEvents,
  subscribeToRangeEvents,
  subscribeToUserEvents,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
} from "@/firebase/calendarService";

export const useCalendarMonth = (year, month) => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      setEvents([]);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    const unsub = subscribeToMonthEvents({
      userId: user.uid,
      year,
      month,
      onChange: (items) => {
        setEvents(items);
        setLoading(false);
        setError(null);
      },
      onError: (e) => {
        setError(e);
        setLoading(false);
      },
    });
    return () => unsub();
  }, [user, year, month]);

  return { events, loading, error };
};

export const useCreateCalendarEvent = () => {
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (payload) => {
      if (!user) throw new Error("You must be signed in to create events.");
      return await createCalendarEvent({
        userId: user.uid,
        title: payload.title,
        description: payload.description,
        eventType: payload.eventType,
        eventDate: payload.eventDate,
      });
    },
  });
};

export const useUpdateCalendarEvent = () => {
  return useMutation({
    mutationFn: async (payload) => {
      await updateCalendarEvent(payload.id, {
        title: payload.title,
        description: payload.description,
        eventType: payload.eventType,
      });
    },
  });
};

export const useDeleteCalendarEvent = () => {
  return useMutation({
    mutationFn: async (id) => {
      await deleteCalendarEvent(id);
    },
  });
};

export const useUpcomingCalendarEvents = (daysAhead) => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      setEvents([]);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    const unsub = subscribeToUpcomingEvents({
      userId: user.uid,
      daysAhead,
      onChange: (items) => {
        setEvents(items);
        setLoading(false);
        setError(null);
      },
      onError: (e) => {
        setError(e);
        setLoading(false);
      },
    });
    return () => unsub();
  }, [user, daysAhead]);

  return { events, loading, error };
};

export const useCalendarRange = (startDate, endDate) => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      setEvents([]);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    const unsub = subscribeToRangeEvents({
      userId: user.uid,
      startDate,
      endDate,
      onChange: (items) => {
        setEvents(items);
        setLoading(false);
        setError(null);
      },
      onError: (e) => {
        setError(e);
        setLoading(false);
      },
    });
    return () => unsub();
  }, [user, startDate, endDate]);

  return { events, loading, error };
};

export const useAllCalendarEvents = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      setEvents([]);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    const unsub = subscribeToUserEvents({
      userId: user.uid,
      onChange: (items) => {
        setEvents(items);
        setLoading(false);
        setError(null);
      },
      onError: (e) => {
        setError(e);
        setLoading(false);
      },
    });
    return () => unsub();
  }, [user]);

  return { events, loading, error };
};
