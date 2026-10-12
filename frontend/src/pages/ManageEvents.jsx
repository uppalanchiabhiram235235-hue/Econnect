import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar, CheckCircle, Edit, MapPin, MessageSquare, PlusCircle,
  Trash2, Users, AlertTriangle, ExternalLink
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { api } from '../lib/api';
import { formatDate } from '../lib/format';
import Button from '../components/Button';
import Badge from '../components/Badge';
import Card from '../components/Card';
import Skeleton from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import ProgressBar from '../components/ProgressBar';

export default function ManageEvents() {
  const { user } = useAuth();
  const toast = useToast();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [deletingId, setDeletingId] = useState(null);

  const fetchEvents = () => {
    setLoading(true);
    api
      .get('/events/mine')
      .then((data) => setEvents(data || []))
      .catch((err) => toast.error(err.message || 'Failed to load events'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleCancelOrDelete = async (event) => {
    const isConfirmed = window.confirm(
      `Are you sure you want to cancel "${event.title}"? Registered volunteers will be notified.`
    );
    if (!isConfirmed) return;

    setDeletingId(event.id);
    try {
      await api.del(`/events/${event.id}`);
      toast.success('Event cancelled / removed successfully');
      fetchEvents();
    } catch (err) {
      toast.error(err.message || 'Failed to cancel event');
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = events.filter((e) => {
    if (filter === 'ALL') return true;
    return e.status === filter;
  });

  const counts = {
    ALL: events.length,
    UPCOMING: events.filter((e) => e.status === 'UPCOMING').length,
    COMPLETED: events.filter((e) => e.status === 'COMPLETED').length,
    CANCELLED: events.filter((e) => e.status === 'CANCELLED').length,
  };

  return (
    <div className="container page">
      <div className="page__header row row--between" style={{ alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div>
          <h1>Manage Events</h1>
          <p>Organize, modify, monitor volunteer capacity, and lead group chats for your events.</p>
        </div>
        <Button to="/organizer/events/new" variant="primary">
          <PlusCircle size={18} aria-hidden="true" />
          Create Event
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="segmented" style={{ marginBottom: 'var(--space-4)', maxWidth: '480px' }}>
        {['ALL', 'UPCOMING', 'COMPLETED', 'CANCELLED'].map((tab) => (
          <button
            key={tab}
            type="button"
            className={`segmented__btn${filter === tab ? ' active' : ''}`}
            onClick={() => setFilter(tab)}
          >
            {tab === 'ALL' ? 'All' : tab.charAt(0) + tab.slice(1).toLowerCase()} ({counts[tab] || 0})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid--cards">
          <Skeleton height="200px" />
          <Skeleton height="200px" />
          <Skeleton height="200px" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title={`No ${filter === 'ALL' ? '' : filter.toLowerCase()} events`}
          text={
            filter === 'ALL'
              ? "You haven't created any events yet. Get started by organizing a community initiative!"
              : `You don't have any events with status "${filter}".`
          }
          action={
            <Button to="/organizer/events/new" variant="primary">
              <PlusCircle size={18} /> Create Event
            </Button>
          }
        />
      ) : (
        <div className="grid grid--cards">
          {filtered.map((e) => {
            const isCancelled = e.status === 'CANCELLED';
            const isCompleted = e.status === 'COMPLETED';
            const progress = e.maxVolunteers > 0 ? (e.currentParticipants / e.maxVolunteers) * 100 : 0;

            return (
              <Card key={e.id} className="stack" style={{ gap: 'var(--space-3)' }}>
                <div className="row row--between" style={{ alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="row" style={{ gap: 'var(--space-1)', marginBottom: '4px' }}>
                      <Badge variant="eco">{e.eventTypeLabel || e.eventType}</Badge>
                      <Badge variant={isCompleted ? 'success' : isCancelled ? 'danger' : 'info'}>
                        {e.status}
                      </Badge>
                    </div>
                    <h3 style={{ fontSize: 'var(--fs-md)', margin: '4px 0', wordBreak: 'break-word' }}>
                      <Link to={`/events/${e.id}`}>{e.title}</Link>
                    </h3>
                  </div>
                </div>

                <div className="stack muted" style={{ fontSize: 'var(--fs-xs)', gap: '6px' }}>
                  <div className="row" style={{ gap: '6px' }}>
                    <Calendar size={14} />
                    <span>{formatDate(e.eventDate)} {e.startTime ? `• ${e.startTime.slice(0, 5)}` : ''}</span>
                  </div>
                  <div className="row" style={{ gap: '6px' }}>
                    <MapPin size={14} />
                    <span className="truncate">{e.location || 'Location not specified'}</span>
                  </div>
                </div>

                {/* Volunteer Slots Progress */}
                <div className="stack" style={{ gap: '4px', fontSize: 'var(--fs-xs)' }}>
                  <div className="row row--between muted">
                    <span>Volunteers</span>
                    <span>{e.currentParticipants} / {e.maxVolunteers} ({Math.round(progress)}%)</span>
                  </div>
                  <ProgressBar value={progress} />
                </div>

                {/* Action Buttons */}
                <div
                  className="row"
                  style={{
                    gap: 'var(--space-2)',
                    marginTop: 'auto',
                    paddingTop: 'var(--space-2)',
                    borderTop: '1px solid var(--color-border)',
                    flexWrap: 'wrap'
                  }}
                >
                  <Button to={`/events/${e.id}/chat`} variant="primary" size="sm" style={{ flex: 1 }}>
                    <MessageSquare size={16} /> Chat
                  </Button>
                  {!isCancelled && !isCompleted && (
                    <Button to={`/organizer/events/${e.id}/edit`} variant="secondary" size="sm">
                      <Edit size={16} /> Edit
                    </Button>
                  )}
                  <Button to={`/events/${e.id}`} variant="ghost" size="sm">
                    View
                  </Button>
                  {!isCancelled && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCancelOrDelete(e)}
                      disabled={deletingId === e.id}
                      style={{ color: 'var(--color-danger)' }}
                      title="Cancel Event"
                    >
                      <Trash2 size={16} />
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
