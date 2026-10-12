import React, { Suspense, useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Calendar, Clock, MapPin, Users, MessageSquare, ArrowLeft,
  CheckCircle2, Sparkles, AlertCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { api } from '../lib/api';
import { formatDate, formatTimeRange } from '../lib/format';
import { EVENT_TYPES, EVENT_STATUS_TONE } from '../lib/eventMeta';
import Button from '../components/Button';
import Badge from '../components/Badge';
import ProgressBar from '../components/ProgressBar';
import Skeleton from '../components/Skeleton';
import EventChat from '../components/EventChat';

const EventStaticMap = React.lazy(() => import('../components/map/EventStaticMap'));


export default function EventDetail({ initialTab }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const toast = useToast();

  const isChatRoute = location.pathname.endsWith('/chat') || initialTab === 'chat';
  const [activeTab, setActiveTab] = useState(isChatRoute ? 'chat' : 'details');
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    setActiveTab(location.pathname.endsWith('/chat') ? 'chat' : 'details');
  }, [location.pathname]);

  const loadEvent = async () => {
    try {
      const data = await api.get(`/events/${id}`);
      setEvent(data);
    } catch (err) {
      toast.error(err.message || 'Failed to load event');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvent();
  }, [id]);

  const handleJoin = async () => {
    setJoining(true);
    try {
      await api.post(`/events/${id}/join`);
      toast.success('You have successfully joined this event!');
      await loadEvent();
    } catch (err) {
      toast.error(err.message || 'Could not join event');
    } finally {
      setJoining(false);
    }
  };

  const handleLeave = async () => {
    if (!window.confirm('Are you sure you want to cancel your registration?')) return;
    setLeaving(true);
    try {
      await api.del(`/events/${id}/leave`);
      toast.info('You have left this event');
      await loadEvent();
    } catch (err) {
      toast.error(err.message || 'Could not leave event');
    } finally {
      setLeaving(false);
    }
  };

  const switchTab = (tab) => {
    setActiveTab(tab);
    if (tab === 'chat') {
      navigate(`/events/${id}/chat`, { replace: true });
    } else {
      navigate(`/events/${id}`, { replace: true });
    }
  };

  if (loading) {
    return (
      <div className="container page">
        <Skeleton height="36px" width="300px" style={{ marginBottom: 'var(--space-4)' }} />
        <Skeleton height="200px" style={{ marginBottom: 'var(--space-5)' }} />
        <Skeleton height="400px" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="container page" style={{ textAlign: 'center' }}>
        <h2>Event Not Found</h2>
        <p className="muted">This event may have been deleted or does not exist.</p>
        <Button to="/events" variant="primary">Browse Events</Button>
      </div>
    );
  }

  const meta = EVENT_TYPES[event.eventType] || EVENT_TYPES.OTHER;
  const isOrganizer = user && event && Number(event.organizerId) === Number(user.id);
  const isRegistered = event.myParticipationStatus === 'REGISTERED';
  const isCompleted = event.myParticipationStatus === 'COMPLETED';
  const canChat = isOrganizer || isRegistered || isCompleted;
  const isFull = event.remainingSlots <= 0;

  return (
    <div className="container page">
      <div style={{ marginBottom: 'var(--space-4)' }}>
        <Link to="/events" className="btn btn--ghost btn--sm" style={{ paddingLeft: 0 }}>
          <ArrowLeft size={16} /> Back to Events
        </Link>
      </div>

      <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
        <div className="row row--between" style={{ alignItems: 'flex-start', marginBottom: 'var(--space-3)' }}>
          <div>
            <div className="row" style={{ gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
              <Badge variant={EVENT_STATUS_TONE[event.status] || 'info'}>
                {event.status}
              </Badge>
              <Badge variant="type" style={{ '--badge-hue': meta.hue }}>
                <meta.icon size={13} /> {event.eventTypeLabel || meta.label}
              </Badge>
            </div>
            <h1>{event.title}</h1>
            <p className="muted" style={{ margin: 0 }}>Organized by <strong>{event.organizerName}</strong></p>
          </div>

          <div className="row" style={{ gap: 'var(--space-2)' }}>
            {isOrganizer ? (
              <Button to={`/organizer/events/${event.id}/edit`} variant="outline">
                Edit Event
              </Button>
            ) : event.status === 'UPCOMING' ? (
              !user ? (
                <Button to="/login" variant="primary">
                  Log in to Join
                </Button>
              ) : !event.myParticipationStatus || event.myParticipationStatus === 'CANCELLED' ? (
                <Button
                  onClick={handleJoin}
                  disabled={joining || isFull}
                  variant={isFull ? 'ghost' : 'primary'}
                >
                  {joining ? 'Joining...' : isFull ? 'Event Full' : 'Join Event'}
                </Button>
              ) : isRegistered ? (
                <Button
                  onClick={handleLeave}
                  disabled={leaving}
                  variant="outline"
                >
                  {leaving ? 'Leaving...' : 'Leave Event'}
                </Button>
              ) : null
            ) : null}
          </div>
        </div>

        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-3)', marginTop: 'var(--space-4)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--border)' }}>
          <div className="row" style={{ gap: 'var(--space-2)' }}>
            <Calendar size={18} className="muted" />
            <div>
              <div className="muted" style={{ fontSize: 'var(--fs-xs)' }}>Date</div>
              <strong>{formatDate(event.eventDate)}</strong>
            </div>
          </div>

          <div className="row" style={{ gap: 'var(--space-2)' }}>
            <Clock size={18} className="muted" />
            <div>
              <div className="muted" style={{ fontSize: 'var(--fs-xs)' }}>Time</div>
              <strong>{formatTimeRange(event.startTime, event.endTime)}</strong>
            </div>
          </div>

          <div className="row" style={{ gap: 'var(--space-2)' }}>
            <MapPin size={18} className="muted" />
            <div>
              <div className="muted" style={{ fontSize: 'var(--fs-xs)' }}>Location</div>
              <strong>{event.location}</strong>
            </div>
          </div>

          <div className="row" style={{ gap: 'var(--space-2)' }}>
            <Users size={18} className="muted" />
            <div style={{ flex: 1 }}>
              <div className="row row--between" style={{ fontSize: 'var(--fs-xs)' }}>
                <span className="muted">Capacity</span>
                <strong>{event.currentParticipants} / {event.maxVolunteers}</strong>
              </div>
              <ProgressBar current={event.currentParticipants} max={event.maxVolunteers} style={{ marginTop: '4px' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'details'}
          className={`tab-btn ${activeTab === 'details' ? 'active' : ''}`}
          onClick={() => switchTab('details')}
        >
          Event Overview
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'chat'}
          className={`tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
          onClick={() => switchTab('chat')}
        >
          <MessageSquare size={17} />
          Group Chat
          {canChat && (
            <span
              style={{
                width: '8px', height: '8px', borderRadius: '50%',
                background: 'var(--primary)', display: 'inline-block',
              }}
              title="Active chat room"
            />
          )}
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === 'chat' ? (
        <EventChat event={event} onJoinSuccess={loadEvent} />
      ) : (
        <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: 'var(--space-5)' }}>
          <div className="stack">
            <div className="card">
              <h3>About this cause</h3>
              <p style={{ whiteSpace: 'pre-line' }}>{event.description || 'No description provided.'}</p>

              {event.objectives && (
                <>
                  <h4 style={{ marginTop: 'var(--space-4)' }}>Key Objectives</h4>
                  <p style={{ whiteSpace: 'pre-line' }}>{event.objectives}</p>
                </>
              )}
            </div>

            {event.verifiedImpact && event.verifiedImpact.length > 0 && (
              <div className="card">
                <h3>Verified Impact</h3>
                <div className="stack" style={{ gap: 'var(--space-3)' }}>
                  {event.verifiedImpact.map((imp) => (
                    <div key={imp.id} className="row row--between" style={{ padding: 'var(--space-3)', background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)' }}>
                      <div>
                        <strong>{imp.metricValue} {imp.unit}</strong>
                        <div className="muted" style={{ fontSize: 'var(--fs-xs)' }}>{imp.impactType}</div>
                      </div>
                      <Badge variant="success">Verified</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="stack">
            <div className="card" style={{ background: 'var(--surface-2)' }}>
              <h4>Join the Conversation</h4>
              <p className="muted" style={{ fontSize: 'var(--fs-sm)' }}>
                Chat with the organizer and fellow volunteers to coordinate arrival, equipment, and updates.
              </p>
              <Button onClick={() => switchTab('chat')} variant="accent" style={{ width: '100%' }}>
                <MessageSquare size={16} /> Open Event Chat
              </Button>
            </div>

            {isRegistered && (
              <div className="card" style={{ borderLeft: '4px solid var(--success)' }}>
                <div className="row" style={{ gap: 'var(--space-2)', color: 'var(--success)', fontWeight: 700 }}>
                  <CheckCircle2 size={18} />
                  <span>You're registered!</span>
                </div>
                <p className="muted" style={{ fontSize: 'var(--fs-sm)', margin: 'var(--space-2) 0 0' }}>
                  Remember to check the group chat for organizer announcements before attending.
                </p>
              </div>
            )}

            {event.latitude != null && event.longitude != null && (
              <Suspense fallback={<Skeleton height="220px" radius="var(--radius-md)" />}>
                <EventStaticMap
                  latitude={event.latitude}
                  longitude={event.longitude}
                  eventType={event.eventType}
                  locationTitle={event.location}
                />
              </Suspense>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
