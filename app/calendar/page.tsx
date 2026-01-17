'use client';

import { useEffect, useState } from 'react';
import Header from '@/app/components/Header';
import AuthGuard from '@/app/components/AuthGuard';
import { Calendar as CalendarIcon, Phone, Target, Rocket, Users } from 'lucide-react';

interface Event {
  id: string;
  eventName: string;
  description: string;
  date: string;
  type: 'Call' | 'Deadline' | 'Launch' | 'Meeting';
  locationLink: string;
}

const typeIcons = {
  Call: Phone,
  Deadline: Target,
  Launch: Rocket,
  Meeting: Users,
};

const typeColors = {
  Call: 'bg-blue-100 text-blue-700',
  Deadline: 'bg-red-100 text-red-700',
  Launch: 'bg-purple-100 text-purple-700',
  Meeting: 'bg-green-100 text-green-700',
};

export default function CalendarPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('All');

  useEffect(() => {
    async function fetchEvents() {
      try {
        setLoading(true);
        const response = await fetch('/api/events');
        if (!response.ok) {
          throw new Error('Failed to fetch events');
        }
        const data = await response.json();
        setEvents(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching events:', error);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    }

    fetchEvents();
  }, []);

  const filteredEvents =
    filter === 'All' ? events : events.filter((e) => e.type === filter);

  const types = ['All', 'Call', 'Deadline', 'Launch', 'Meeting'];

  const now = new Date();
  const upcomingEvents = filteredEvents.filter((e) => new Date(e.date) >= now);
  const pastEvents = filteredEvents.filter((e) => new Date(e.date) < now);

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <Header />

        <div className="max-w-5xl mx-auto px-6 py-12 pt-32">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <CalendarIcon className="w-8 h-8 text-gray-700" />
              <h1 className="text-4xl font-bold text-gray-900">Events & Calendar</h1>
            </div>
            <p className="text-lg text-gray-600">
              Wichtige Termine, Calls, Deadlines und Launch-Dates.
            </p>
          </div>

          <div className="mb-6 flex gap-2 flex-wrap">
            {types.map((type) => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === type
                    ? 'bg-gray-900 text-white'
                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-500">
              Lade Events...
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-500">
              Noch keine Events vorhanden.
            </div>
          ) : (
            <div className="space-y-8">
              {upcomingEvents.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Upcoming Events ({upcomingEvents.length})
                  </h2>
                  <div className="space-y-3">
                    {upcomingEvents.map((event) => {
                      const Icon = typeIcons[event.type];
                      const daysUntil = Math.ceil(
                        (new Date(event.date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
                      );
                      const isToday = daysUntil === 0;
                      const isTomorrow = daysUntil === 1;

                      return (
                        <div
                          key={event.id}
                          className={`bg-white rounded-xl border p-5 hover:border-gray-300 transition-colors ${
                            isToday
                              ? 'border-blue-500 border-2'
                              : 'border-gray-200'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3 flex-1">
                              <div
                                className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                  typeColors[event.type]
                                }`}
                              >
                                <Icon className="w-5 h-5" />
                              </div>
                              <div className="flex-1">
                                <h3 className="font-semibold text-gray-900 mb-1">
                                  {event.eventName}
                                </h3>
                                <p className="text-sm text-gray-600 mb-2">{event.description}</p>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                  <CalendarIcon className="w-3 h-3" />
                                  <span className={isToday ? 'font-bold text-blue-600' : ''}>
                                    {new Date(event.date).toLocaleDateString('de-DE', {
                                      weekday: 'long',
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric',
                                    })}
                                  </span>
                                  {isToday && (
                                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                      Heute
                                    </span>
                                  )}
                                  {isTomorrow && (
                                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                                      Morgen
                                    </span>
                                  )}
                                  {!isToday && !isTomorrow && daysUntil > 0 && (
                                    <span className="text-gray-400 ml-2">
                                      in {daysUntil} Tag{daysUntil !== 1 ? 'en' : ''}
                                    </span>
                                  )}
                                </div>
                                {event.locationLink && (
                                  <a
                                    href={event.locationLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 mt-2"
                                  >
                                    Link zum Event →
                                  </a>
                                )}
                              </div>
                            </div>
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${
                                typeColors[event.type]
                              }`}
                            >
                              {event.type}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {pastEvents.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-500 mb-4">
                    Past Events ({pastEvents.length})
                  </h2>
                  <div className="space-y-3">
                    {pastEvents.map((event) => {
                      const Icon = typeIcons[event.type];
                      return (
                        <div
                          key={event.id}
                          className="bg-white rounded-xl border border-gray-200 p-5 opacity-60"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3 flex-1">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-gray-100 text-gray-600`}>
                                <Icon className="w-5 h-5" />
                              </div>
                              <div className="flex-1">
                                <h3 className="font-semibold text-gray-700 mb-1">
                                  {event.eventName}
                                </h3>
                                <p className="text-sm text-gray-500 mb-2">{event.description}</p>
                                <div className="flex items-center gap-2 text-xs text-gray-400">
                                  <CalendarIcon className="w-3 h-3" />
                                  <span>
                                    {new Date(event.date).toLocaleDateString('de-DE', {
                                      weekday: 'long',
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric',
                                    })}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-600">
                              {event.type}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}