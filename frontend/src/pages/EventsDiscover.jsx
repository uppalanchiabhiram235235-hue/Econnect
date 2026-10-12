import React, { Suspense, useEffect, useState } from 'react';
import {
  Calendar, Compass, List, Locate, Map as MapIcon,
  MapPin, MessageSquare, Search, Users, X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { api } from '../lib/api';
import { formatDate } from '../lib/format';
import { EVENT_TYPES, EVENT_STATUS_TONE, eventTypeOptions } from '../lib/eventMeta';
import Button from '../components/Button';
import Badge from '../components/Badge';
import Card from '../components/Card';
import ProgressBar from '../components/ProgressBar';
import Skeleton from '../components/Skeleton';
import EmptyState from '../components/EmptyState';

const EventsMap = React.lazy(() => import('../components/map/EventsMap'));

export default function EventsDiscover() {
  const { user } = useAuth();
  const toast = useToast();

  const [viewMode, setViewMode] = useState('list');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [type, setType] = useState('');

  // Near Me state
  const [nearMeActive, setNearMeActive] = useState(false);
  const [radiusKm, setRadiusKm] = useState(25);
  const [userCoords, setUserCoords] = useState(null);
  const [locating, setLocating] = useState(false);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const params = {};
      if (q) params.q = q;
      if (type) params.type = type;
      if (nearMeActive && userCoords) {
        params.lat = userCoords.lat;
        params.lng = userCoords.lng;
        params.radiusKm = radiusKm;
      }
      const data = await api.get('/events', { params });
      setEvents(data || []);
    } catch (err) {
      toast.error(err.message || 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [type, nearMeActive, userCoords, radiusKm]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchEvents();
  };

  const handleNearMeClick = () => {
    if (nearMeActive) {
      // Toggle off
      setNearMeActive(false);
      setUserCoords(null);
      return;
    }

    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser.');
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);
        setUserCoords({
          lat: Number(position.coords.latitude.toFixed(6)),
          lng: Number(position.coords.longitude.toFixed(6)),
        });
        setNearMeActive(true);
        toast.success(`Location set! Showing causes within ${radiusKm} km.`);
      },
      (error) => {
        setLocating(false);
        let msg = 'Could not retrieve your location. Check browser permissions.';
        if (error.code === error.PERMISSION_DENIED) {
          msg = 'Location permission was denied. Please allow location access to discover nearby events.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg = 'Location information is currently unavailable.';
        } else if (error.code === error.TIMEOUT) {
          msg = 'Location request timed out. Please try again.';
        }
        toast.error(msg);
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  const clearAllFilters = () => {
    setQ('');
    setType('');
    setNearMeActive(false);
    setUserCoords(null);
  };

  return (
    <div className="container page">
      <div className="page__header row row--between" style={{ alignItems: 'flex-start' }}>
        <div>
          <h1>Discover Events</h1>
          <p>Explore impactful volunteer causes happening in your area and join the movement.</p>
        </div>

        {/* List / Map Toggle */}
        <div className="segmented-toggle" role="group" aria-label="View layout switcher">
          <button
            type="button"
            className={`segmented-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
            aria-pressed={viewMode === 'list'}
          >
            <List size={16} /> List
          </button>
          <button
            type="button"
            className={`segmented-btn ${viewMode === 'map' ? 'active' : ''}`}
            onClick={() => setViewMode('map')}
            aria-pressed={viewMode === 'map'}
          >
            <MapIcon size={16} /> Map
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <form onSubmit={handleSearchSubmit} className="row" style={{ gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
        <div style={{ flex: '1 1 220px', position: 'relative' }}>
          <input
            type="search"
            className="input"
            placeholder="Search by title or location..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Search events"
          />
        </div>
        <div style={{ flex: '0 0 190px' }}>
          <select
            className="select"
            value={type}
            onChange={(e) => setType(e.target.value)}
            aria-label="Filter by event type"
          >
            <option value="">All Categories</option>
            {eventTypeOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Near Me & Radius Control */}
        <div className="row" style={{ gap: 'var(--space-2)' }}>
          <Button
            type="button"
            variant={nearMeActive ? 'primary' : 'outline'}
            onClick={handleNearMeClick}
            disabled={locating}
            aria-pressed={nearMeActive}
          >
            <Locate size={16} />
            {locating ? 'Locating...' : nearMeActive ? 'Near Me (Active)' : 'Near Me'}
          </Button>

          {nearMeActive && (
            <select
              className="select"
              style={{ width: '110px' }}
              value={radiusKm}
              onChange={(e) => setRadiusKm(Number(e.target.value))}
              aria-label="Filter radius in kilometers"
            >
              <option value={5}>5 km</option>
              <option value={10}>10 km</option>
              <option value={25}>25 km</option>
              <option value={50}>50 km</option>
            </select>
          )}

          <Button type="submit" variant="ghost">
            <Search size={16} /> Search
          </Button>
        </div>
      </form>

      {/* Active distance filter banner */}
      {nearMeActive && (
        <div className="row row--between" style={{ padding: 'var(--space-2) var(--space-4)', background: 'var(--primary-soft)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)' }}>
          <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 700, color: 'var(--primary)' }}>
            Showing causes within <strong>{radiusKm} km</strong> of your detected location, sorted by distance.
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setNearMeActive(false); setUserCoords(null); }}
          >
            <X size={14} /> Clear Radius Filter
          </Button>
        </div>
      )}

      {/* Main View: Map or List */}
      {viewMode === 'map' ? (
        <Suspense fallback={<Skeleton height="560px" radius="var(--radius-lg)" />}>
          <EventsMap events={events} />
        </Suspense>
      ) : loading ? (
        <div className="grid grid--cards">
          <Skeleton height="240px" />
          <Skeleton height="240px" />
          <Skeleton height="240px" />
        </div>
      ) : events.length === 0 ? (
        <EmptyState
          icon={Compass}
          title="No events found"
          text="Try adjusting your search query, radius, or filters to find upcoming causes."
          action={
            <Button onClick={clearAllFilters} variant="outline">
              Clear Filters
            </Button>
          }
        />
      ) : (
        <div className="grid grid--cards">
          {events.map((e) => {
            const meta = EVENT_TYPES[e.eventType] || EVENT_TYPES.OTHER;
            const isJoined = e.myParticipationStatus === 'REGISTERED' || e.myParticipationStatus === 'COMPLETED';
            return (
              <Card key={e.id} className="card--interactive stack" style={{ gap: 'var(--space-3)' }}>
                <div className="row row--between" style={{ alignItems: 'flex-start' }}>
                  <Badge variant="type" style={{ '--badge-hue': meta.hue }}>
                    <meta.icon size={13} /> {e.eventTypeLabel || meta.label}
                  </Badge>
                  <div className="row" style={{ gap: 'var(--space-1)' }}>
                    {e.distanceKm != null && (
                      <Badge variant="eco">📍 {e.distanceKm} km away</Badge>
                    )}
                    <Badge variant={EVENT_STATUS_TONE[e.status] || 'info'}>
                      {e.status}
                    </Badge>
                  </div>
                </div>

                <div>
                  <h3 style={{ fontSize: 'var(--fs-lg)', marginBottom: '4px' }}>{e.title}</h3>
                  <div className="row muted" style={{ fontSize: 'var(--fs-xs)', gap: 'var(--space-1)', marginBottom: '2px' }}>
                    <Calendar size={13} /> {formatDate(e.eventDate)}
                  </div>
                  <div className="row muted" style={{ fontSize: 'var(--fs-xs)', gap: 'var(--space-1)' }}>
                    <MapPin size={13} /> {e.location}
                  </div>
                </div>

                <div style={{ marginTop: 'auto', paddingTop: 'var(--space-2)' }}>
                  <div className="row row--between" style={{ fontSize: 'var(--fs-xs)', marginBottom: '4px' }}>
                    <span className="muted">{e.remainingSlots} slots remaining</span>
                    <span className="muted">{e.currentParticipants} / {e.maxVolunteers}</span>
                  </div>
                  <ProgressBar current={e.currentParticipants} max={e.maxVolunteers} />
                </div>

                <div className="row" style={{ gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                  <Button to={`/events/${e.id}`} variant="primary" size="sm" style={{ flex: 1 }}>
                    View Details
                  </Button>
                  {isJoined && (
                    <Button to={`/events/${e.id}/chat`} variant="accent" size="sm" title="Open Chat">
                      <MessageSquare size={16} /> Chat
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
