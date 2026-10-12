import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar, CheckCircle, Clock, MessageSquare, PlusCircle,
  Users, Award, ArrowRight, BarChart3, Edit, MapPin, Sparkles
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

export default function OrganizerDashboard() {
  const { user } = useAuth();
  const toast = useToast();

  const [stats, setStats] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let isMounted = true;
    setLoading(true);

    Promise.all([
      api.get(`/organizers/${user.id}/statistics`).catch(() => null),
      api.get('/events/mine').catch(() => [])
    ])
      .then(([statsData, eventsData]) => {
        if (!isMounted) return;
        setStats(statsData);
        setEvents(eventsData || []);
      })
      .catch((err) => {
        toast.error(err.message || 'Failed to load dashboard data');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [user]);

  const upcomingEvents = events.filter((e) => e.status === 'UPCOMING');

  return (
    <div className="container page">
      <div className="page__header row row--between" style={{ alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div>
          <h1>Organizer Dashboard</h1>
          <p>Welcome back, {user?.name}! Coordinate your community clean-ups and track social impact.</p>
        </div>
        <div className="row" style={{ gap: 'var(--space-2)' }}>
          <Button to="/organizer/events/new" variant="primary">
            <PlusCircle size={18} aria-hidden="true" />
            Create Event
          </Button>
          <Button to="/organizer/events" variant="secondary">
            Manage Events
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="stack" style={{ gap: 'var(--space-4)' }}>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-3)' }}>
            <Skeleton height="110px" />
            <Skeleton height="110px" />
            <Skeleton height="110px" />
            <Skeleton height="110px" />
          </div>
          <Skeleton height="260px" />
        </div>
      ) : (
        <div className="stack" style={{ gap: 'var(--space-5)' }}>
          {/* Key Metrics */}
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-3)' }}>
            <Card className="stack" style={{ gap: 'var(--space-1)', padding: 'var(--space-3)' }}>
              <div className="row row--between muted" style={{ fontSize: 'var(--fs-xs)' }}>
                <span>Total Causes</span>
                <Calendar size={18} />
              </div>
              <div style={{ fontSize: 'var(--fs-2xl)', fontWeight: 'var(--fw-bold)' }}>
                {stats?.totalEvents ?? events.length}
              </div>
              <span className="muted" style={{ fontSize: 'var(--fs-xs)' }}>Events initiated by you</span>
            </Card>

            <Card className="stack" style={{ gap: 'var(--space-1)', padding: 'var(--space-3)' }}>
              <div className="row row--between muted" style={{ fontSize: 'var(--fs-xs)' }}>
                <span>Upcoming</span>
                <Clock size={18} />
              </div>
              <div style={{ fontSize: 'var(--fs-2xl)', fontWeight: 'var(--fw-bold)', color: 'var(--color-primary)' }}>
                {stats?.upcomingEvents ?? upcomingEvents.length}
              </div>
              <span className="muted" style={{ fontSize: 'var(--fs-xs)' }}>Ready for volunteers</span>
            </Card>

            <Card className="stack" style={{ gap: 'var(--space-1)', padding: 'var(--space-3)' }}>
              <div className="row row--between muted" style={{ fontSize: 'var(--fs-xs)' }}>
                <span>Total Volunteers</span>
                <Users size={18} />
              </div>
              <div style={{ fontSize: 'var(--fs-2xl)', fontWeight: 'var(--fw-bold)' }}>
                {stats?.totalParticipants ?? 0}
              </div>
              <span className="muted" style={{ fontSize: 'var(--fs-xs)' }}>Registered participants</span>
            </Card>

            <Card className="stack" style={{ gap: 'var(--space-1)', padding: 'var(--space-3)' }}>
              <div className="row row--between muted" style={{ fontSize: 'var(--fs-xs)' }}>
                <span>Verified Impact</span>
                <Sparkles size={18} />
              </div>
              <div style={{ fontSize: 'var(--fs-2xl)', fontWeight: 'var(--fw-bold)', color: 'var(--color-accent)' }}>
                {stats?.verifiedImpactRecords ?? 0}
              </div>
              <span className="muted" style={{ fontSize: 'var(--fs-xs)' }}>Impact achievements verified</span>
            </Card>
          </div>

          {/* Active Events Section */}
          <div className="stack" style={{ gap: 'var(--space-3)' }}>
            <div className="row row--between">
              <h2>Your Upcoming & Active Events</h2>
              <Link to="/organizer/events" className="row" style={{ fontSize: 'var(--fs-sm)', gap: '4px', color: 'var(--color-primary)' }}>
                View all ({events.length}) <ArrowRight size={16} />
              </Link>
            </div>

            {upcomingEvents.length === 0 ? (
              <EmptyState
                icon={Calendar}
                title="No upcoming events"
                text="You don't have any active upcoming events scheduled. Create one now to mobilize volunteers!"
                action={
                  <Button to="/organizer/events/new" variant="primary">
                    <PlusCircle size={18} /> Create Your First Event
                  </Button>
                }
              />
            ) : (
              <div className="grid grid--cards">
                {upcomingEvents.slice(0, 4).map((e) => (
                  <Card key={e.id} className="stack" style={{ gap: 'var(--space-3)' }}>
                    <div className="row row--between" style={{ alignItems: 'flex-start' }}>
                      <div>
                        <Badge variant="eco">{e.eventTypeLabel || e.eventType}</Badge>
                        <h3 style={{ fontSize: 'var(--fs-md)', marginTop: 'var(--space-1)', marginBottom: '4px' }}>
                          <Link to={`/events/${e.id}`}>{e.title}</Link>
                        </h3>
                      </div>
                      <Badge variant={e.status === 'UPCOMING' ? 'info' : 'success'}>
                        {e.status}
                      </Badge>
                    </div>

                    <div className="stack muted" style={{ fontSize: 'var(--fs-xs)', gap: '4px' }}>
                      <div className="row" style={{ gap: '6px' }}>
                        <Calendar size={14} />
                        <span>{formatDate(e.eventDate)} {e.startTime ? `• ${e.startTime.slice(0, 5)}` : ''}</span>
                      </div>
                      <div className="row" style={{ gap: '6px' }}>
                        <MapPin size={14} />
                        <span>{e.location || 'Location not specified'}</span>
                      </div>
                      <div className="row" style={{ gap: '6px' }}>
                        <Users size={14} />
                        <span>{e.currentParticipants || 0} / {e.maxVolunteers} volunteers joined</span>
                      </div>
                    </div>

                    <div className="row" style={{ gap: 'var(--space-2)', marginTop: 'auto', paddingTop: 'var(--space-2)', borderTop: '1px solid var(--color-border)' }}>
                      <Button to={`/events/${e.id}/chat`} variant="primary" size="sm" style={{ flex: 1 }}>
                        <MessageSquare size={16} /> Chat
                      </Button>
                      <Button to={`/organizer/events/${e.id}/edit`} variant="secondary" size="sm">
                        <Edit size={16} /> Edit
                      </Button>
                      <Button to={`/events/${e.id}`} variant="ghost" size="sm">
                        Details
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
