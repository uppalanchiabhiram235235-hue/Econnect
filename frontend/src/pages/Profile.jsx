import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Award, Calendar, CheckCircle, Mail, MapPin, Phone,
  Save, Sparkles, User as UserIcon, Shield, Trophy, Printer, FileText
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { api } from '../lib/api';
import { initials } from '../lib/format';
import Button from '../components/Button';
import Badge from '../components/Badge';
import Card from '../components/Card';
import Field from '../components/Field';
import Skeleton from '../components/Skeleton';
import ProgressBar from '../components/ProgressBar';

export default function Profile() {
  const { user, login } = useAuth();
  const toast = useToast();

  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const [completedCauses, setCompletedCauses] = useState([]);

  useEffect(() => {
    if (!user) return;
    let isMounted = true;
    setLoading(true);

    const isOrg = user.role === 'ORGANIZER';

    Promise.all([
      api.get(`/users/${user.id}`),
      isOrg
        ? api.get(`/organizers/${user.id}/statistics`).catch(() => null)
        : api.get(`/users/${user.id}/statistics`).catch(() => null),
      !isOrg ? api.get(`/users/${user.id}/badges`).catch(() => []) : Promise.resolve([]),
      !isOrg ? api.get('/users/me/participations').catch(() => []) : Promise.resolve([])
    ])
      .then(([userData, statsData, badgesData, partData]) => {
        if (!isMounted) return;
        setProfile(userData);
        setName(userData.name || '');
        setPhone(userData.phone || '');
        setLocation(userData.location || '');
        setStats(statsData);
        setBadges(badgesData || []);
        setCompletedCauses((partData || []).filter((p) => p.participationStatus === 'COMPLETED'));
      })
      .catch((err) => {
        toast.error(err.message || 'Failed to load profile details');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFieldErrors({});

    try {
      const updated = await api.put(`/users/${user.id}`, {
        body: {
          name,
          phone,
          location,
        },
      });

      setProfile(updated);
      toast.success('Profile updated successfully!');
    } catch (err) {
      if (err.fieldErrors) {
        setFieldErrors(err.fieldErrors);
      }
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const isOrganizer = user?.role === 'ORGANIZER';

  return (
    <div className="container page">
      <div className="page__header">
        <h1>User Profile</h1>
        <p>Manage your personal details, view your community contributions and credentials.</p>
      </div>

      {loading ? (
        <div className="stack" style={{ gap: 'var(--space-4)' }}>
          <Skeleton height="160px" />
          <div className="grid grid--2col">
            <Skeleton height="320px" />
            <Skeleton height="320px" />
          </div>
        </div>
      ) : (
        <div className="stack" style={{ gap: 'var(--space-5)' }}>
          {/* Header Card */}
          <Card className="row row--between" style={{ alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-4)', padding: 'var(--space-4)' }}>
            <div className="row" style={{ gap: 'var(--space-3)', alignItems: 'center' }}>
              <div
                className="avatar"
                style={{
                  width: '68px',
                  height: '68px',
                  fontSize: 'var(--fs-xl)',
                  background: 'var(--color-primary)',
                  color: 'var(--color-surface)',
                  borderRadius: 'var(--radius-full)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'var(--fw-bold)'
                }}
              >
                {initials(profile?.name || user?.name)}
              </div>
              <div>
                <div className="row" style={{ gap: 'var(--space-2)', alignItems: 'center' }}>
                  <h2 style={{ fontSize: 'var(--fs-xl)', margin: 0 }}>{profile?.name}</h2>
                  <Badge variant={isOrganizer ? 'primary' : 'eco'}>
                    {profile?.role || user?.role}
                  </Badge>
                </div>
                <div className="row muted" style={{ fontSize: 'var(--fs-sm)', gap: 'var(--space-2)', marginTop: '4px' }}>
                  <span className="row" style={{ gap: '4px' }}><Mail size={14} /> {profile?.email}</span>
                  {profile?.location && (
                    <span className="row" style={{ gap: '4px' }}><MapPin size={14} /> {profile?.location}</span>
                  )}
                </div>
              </div>
            </div>

            {!isOrganizer && (
              <div className="stack" style={{ alignItems: 'flex-end', gap: '4px' }}>
                <span className="muted" style={{ fontSize: 'var(--fs-xs)' }}>Volunteer Level</span>
                <Badge variant="eco" style={{ fontSize: 'var(--fs-sm)', padding: '6px 12px' }}>
                  <Trophy size={14} style={{ marginRight: '4px' }} />
                  {profile?.level || 'Beginner'} ({profile?.points || 0} pts)
                </Badge>
              </div>
            )}
          </Card>

          {/* Main 2-column Grid */}
          <div className="grid grid--2col" style={{ alignItems: 'start' }}>
            {/* Edit Profile Form */}
            <Card className="stack" style={{ gap: 'var(--space-4)', padding: 'var(--space-4)' }}>
              <div>
                <h3 style={{ fontSize: 'var(--fs-lg)', marginBottom: '4px' }}>Edit Details</h3>
                <p className="muted" style={{ fontSize: 'var(--fs-xs)' }}>Update your public display name and contact preferences.</p>
              </div>

              <form onSubmit={handleSubmit} className="stack" style={{ gap: 'var(--space-3)' }}>
                <Field label="Full Name" required error={fieldErrors.name}>
                  <input
                    type="text"
                    className="input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    required
                  />
                </Field>

                <Field label="Email Address">
                  <input
                    type="email"
                    className="input"
                    value={profile?.email || ''}
                    disabled
                    title="Email cannot be modified"
                  />
                </Field>

                <Field label="Phone Number" error={fieldErrors.phone}>
                  <input
                    type="tel"
                    className="input"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +1 555-0199"
                  />
                </Field>

                <Field label="City / Location" error={fieldErrors.location}>
                  <input
                    type="text"
                    className="input"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Portland, OR"
                  />
                </Field>

                <div style={{ marginTop: 'var(--space-2)' }}>
                  <Button type="submit" variant="primary" disabled={saving}>
                    <Save size={16} />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            </Card>

            {/* Statistics & Activity */}
            <div className="stack" style={{ gap: 'var(--space-4)' }}>
              <Card className="stack" style={{ gap: 'var(--space-3)', padding: 'var(--space-4)' }}>
                <h3 style={{ fontSize: 'var(--fs-lg)' }}>
                  {isOrganizer ? 'Organizing Overview' : 'Contribution Summary'}
                </h3>

                {isOrganizer ? (
                  <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                    <div className="stack" style={{ gap: '2px' }}>
                      <span className="muted" style={{ fontSize: 'var(--fs-xs)' }}>Events Hosted</span>
                      <strong style={{ fontSize: 'var(--fs-xl)' }}>{stats?.totalEvents ?? 0}</strong>
                    </div>
                    <div className="stack" style={{ gap: '2px' }}>
                      <span className="muted" style={{ fontSize: 'var(--fs-xs)' }}>Completed Causes</span>
                      <strong style={{ fontSize: 'var(--fs-xl)' }}>{stats?.completedEvents ?? 0}</strong>
                    </div>
                    <div className="stack" style={{ gap: '2px' }}>
                      <span className="muted" style={{ fontSize: 'var(--fs-xs)' }}>Volunteers Joined</span>
                      <strong style={{ fontSize: 'var(--fs-xl)' }}>{stats?.totalParticipants ?? 0}</strong>
                    </div>
                    <div className="stack" style={{ gap: '2px' }}>
                      <span className="muted" style={{ fontSize: 'var(--fs-xs)' }}>Verified Impact</span>
                      <strong style={{ fontSize: 'var(--fs-xl)' }}>{stats?.verifiedImpactRecords ?? 0}</strong>
                    </div>
                  </div>
                ) : (
                  <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                    <div className="stack" style={{ gap: '2px' }}>
                      <span className="muted" style={{ fontSize: 'var(--fs-xs)' }}>Causes Joined</span>
                      <strong style={{ fontSize: 'var(--fs-xl)' }}>{stats?.eventsJoined ?? 0}</strong>
                    </div>
                    <div className="stack" style={{ gap: '2px' }}>
                      <span className="muted" style={{ fontSize: 'var(--fs-xs)' }}>Causes Completed</span>
                      <strong style={{ fontSize: 'var(--fs-xl)' }}>{stats?.eventsCompleted ?? 0}</strong>
                    </div>
                    <div className="stack" style={{ gap: '2px' }}>
                      <span className="muted" style={{ fontSize: 'var(--fs-xs)' }}>Times Present</span>
                      <strong style={{ fontSize: 'var(--fs-xl)' }}>{stats?.presentCount ?? 0}</strong>
                    </div>
                    <div className="stack" style={{ gap: '2px' }}>
                      <span className="muted" style={{ fontSize: 'var(--fs-xs)' }}>Impact Verified</span>
                      <strong style={{ fontSize: 'var(--fs-xl)' }}>{stats?.verifiedImpactRecords ?? 0}</strong>
                    </div>
                  </div>
                )}
              </Card>

              {/* Badges for Volunteer */}
              {!isOrganizer && (
                <Card className="stack" style={{ gap: 'var(--space-3)', padding: 'var(--space-4)' }}>
                  <div className="row row--between">
                    <h3 style={{ fontSize: 'var(--fs-lg)' }}>Earned Badges</h3>
                    <Badge variant="eco">{badges.length} Unlocked</Badge>
                  </div>

                  {badges.length === 0 ? (
                    <p className="muted" style={{ fontSize: 'var(--fs-sm)', margin: 0 }}>
                      Complete community events to earn honor badges and level up your eco credentials!
                    </p>
                  ) : (
                    <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 'var(--space-2)' }}>
                      {badges.map((b) => (
                        <div
                          key={b.id || b.name}
                          className="stack"
                          style={{
                            alignItems: 'center',
                            textAlign: 'center',
                            padding: 'var(--space-2)',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--color-border)',
                            gap: '4px'
                          }}
                        >
                          <Award size={24} style={{ color: 'var(--color-primary)' }} />
                          <strong style={{ fontSize: 'var(--fs-xs)' }}>{b.name}</strong>
                          <span className="muted" style={{ fontSize: '10px' }}>{b.description}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              )}

              {/* Official Impact Certificates for Volunteer */}
              {!isOrganizer && (
                <Card className="stack" style={{ gap: 'var(--space-3)', padding: 'var(--space-4)' }}>
                  <div className="row row--between">
                    <h3 style={{ fontSize: 'var(--fs-lg)' }}>Official Certificates</h3>
                    <Badge variant="accent">{completedCauses.length} Earned</Badge>
                  </div>

                  {completedCauses.length === 0 ? (
                    <p className="muted" style={{ fontSize: 'var(--fs-sm)', margin: 0 }}>
                      Once you participate in and complete a verified cause, your printable certificate of recognition will appear here!
                    </p>
                  ) : (
                    <div className="stack" style={{ gap: 'var(--space-2)' }}>
                      {completedCauses.map((p) => (
                        <div
                          key={p.participationId || p.id}
                          className="row row--between"
                          style={{
                            padding: 'var(--space-3)',
                            background: 'var(--color-surface-2)',
                            borderRadius: 'var(--radius-md)',
                            alignItems: 'center',
                            gap: 'var(--space-2)'
                          }}
                        >
                          <div className="row" style={{ gap: 'var(--space-2)', alignItems: 'center' }}>
                            <FileText size={20} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                            <div>
                              <strong style={{ fontSize: 'var(--fs-sm)', display: 'block' }}>{p.eventTitle}</strong>
                              <span className="muted" style={{ fontSize: 'var(--fs-xs)' }}>
                                {p.hoursContributed ? `${p.hoursContributed} hrs contributed` : 'Verified Volunteer'}
                              </span>
                            </div>
                          </div>
                          <Link
                            to={`/certificate/${p.participationId || p.id}`}
                            className="btn btn--primary btn--sm"
                            style={{ gap: '4px', textDecoration: 'none' }}
                          >
                            <Printer size={14} /> Certificate
                          </Link>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
