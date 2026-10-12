import { useEffect, useState } from 'react';
import { Calendar, MessageSquare, Award, ExternalLink, CalendarCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { api } from '../lib/api';
import { formatDate } from '../lib/format';
import Button from '../components/Button';
import Badge from '../components/Badge';
import Card from '../components/Card';
import Skeleton from '../components/Skeleton';
import EmptyState from '../components/EmptyState';

export default function JoinedEvents() {
  const { user } = useAuth();
  const toast = useToast();
  const [participations, setParticipations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/users/me/participations')
      .then((data) => setParticipations(data || []))
      .catch((err) => toast.error(err.message || 'Failed to load your joined events'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="container page">
      <div className="page__header">
        <h1>Joined Events</h1>
        <p>Keep track of the causes you've signed up for, connect with coordinators, and view attendance.</p>
      </div>

      {loading ? (
        <div className="grid grid--cards">
          <Skeleton height="180px" />
          <Skeleton height="180px" />
          <Skeleton height="180px" />
        </div>
      ) : participations.length === 0 ? (
        <EmptyState
          icon={CalendarCheck}
          title="No joined events yet"
          text="You haven't registered for any events yet. Explore open causes in your community and get involved!"
          action={<Button to="/events" variant="primary">Explore Events</Button>}
        />
      ) : (
        <div className="grid grid--cards">
          {participations.map((p) => {
            const isCompleted = p.participationStatus === 'COMPLETED';
            return (
              <Card key={p.id} className="stack" style={{ gap: 'var(--space-3)' }}>
                <div className="row row--between" style={{ alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ fontSize: 'var(--fs-lg)', marginBottom: '4px' }}>{p.eventTitle}</h3>
                    <div className="row muted" style={{ fontSize: 'var(--fs-xs)', gap: 'var(--space-1)' }}>
                      <Calendar size={14} />
                      <span>{formatDate(p.eventDate)}</span>
                    </div>
                  </div>
                  <Badge variant={isCompleted ? 'success' : p.participationStatus === 'CANCELLED' ? 'danger' : 'info'}>
                    {p.participationStatus}
                  </Badge>
                </div>

                <div className="row" style={{ fontSize: 'var(--fs-xs)', gap: 'var(--space-2)' }}>
                  <span className="muted">Attendance:</span>
                  <Badge variant={p.attendanceStatus === 'PRESENT' ? 'eco' : p.attendanceStatus === 'ABSENT' ? 'danger' : 'warning'}>
                    {p.attendanceStatus.replace('_', ' ')}
                  </Badge>
                </div>

                <div className="row" style={{ marginTop: 'auto', paddingTop: 'var(--space-2)', gap: 'var(--space-2)' }}>
                  <Button
                    to={`/events/${p.eventId}/chat`}
                    variant="accent"
                    size="sm"
                    aria-label={`Open chat for ${p.eventTitle}`}
                  >
                    <MessageSquare size={16} /> Chat
                  </Button>
                  <Button
                    to={`/events/${p.eventId}`}
                    variant="outline"
                    size="sm"
                  >
                    Details
                  </Button>

                  {/* Future certificate button for completed participation will go here in Feature 3 */}
                  {isCompleted && (
                    <Button
                      to={`/certificate/${p.id}`}
                      variant="primary"
                      size="sm"
                      title="View & Print Official Certificate"
                    >
                      <Award size={16} /> Certificate
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
