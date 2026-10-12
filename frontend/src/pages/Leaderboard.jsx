import { useEffect, useState } from 'react';
import { Award, Calendar, ChevronRight, Crown, Medal, Sparkles, Trophy, Users, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { api } from '../lib/api';
import { initials } from '../lib/format';
import Button from '../components/Button';
import Badge from '../components/Badge';
import Card from '../components/Card';
import Skeleton from '../components/Skeleton';
import EmptyState from '../components/EmptyState';

export default function Leaderboard() {
  const { user } = useAuth();
  const toast = useToast();

  const [scope, setScope] = useState('ALL_TIME');
  const [entries, setEntries] = useState([]);
  const [myRank, setMyRank] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const calls = [api.get(`/leaderboard?scope=${scope}&limit=50`)];
    if (user && user.role === 'VOLUNTEER') {
      calls.push(api.get('/users/me/rank').catch(() => null));
    }

    Promise.all(calls)
      .then(([leaderboardData, rankData]) => {
        if (!isMounted) return;
        setEntries(leaderboardData || []);
        if (rankData) setMyRank(rankData);
      })
      .catch((err) => {
        toast.error(err.message || 'Failed to load leaderboard');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [scope, user]);

  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);

  return (
    <div className="container page" style={{ paddingBottom: user?.role === 'VOLUNTEER' && myRank ? '100px' : 'var(--space-6)' }}>
      <div className="page__header row row--between" style={{ alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div>
          <div className="row" style={{ gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
            <Badge variant="accent">
              <Trophy size={14} style={{ marginRight: '4px' }} />
              Community Champions
            </Badge>
          </div>
          <h1>Volunteer Leaderboard</h1>
          <p>Celebrating the remarkable volunteers making real environmental and social impact.</p>
        </div>

        {/* Scope Tabs */}
        <div className="segmented">
          <button
            type="button"
            className={`segmented__btn ${scope === 'ALL_TIME' ? 'active' : ''}`}
            onClick={() => setScope('ALL_TIME')}
          >
            All Time
          </button>
          <button
            type="button"
            className={`segmented__btn ${scope === 'THIS_MONTH' ? 'active' : ''}`}
            onClick={() => setScope('THIS_MONTH')}
          >
            This Month
          </button>
        </div>
      </div>

      {loading ? (
        <div className="stack" style={{ gap: 'var(--space-5)' }}>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-4)' }}>
            <Skeleton height="260px" />
            <Skeleton height="280px" />
            <Skeleton height="240px" />
          </div>
          <Skeleton height="350px" />
        </div>
      ) : entries.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="No completed records yet"
          text={`No volunteers have completed causes for the ${scope === 'THIS_MONTH' ? 'current month' : 'selected period'} yet. Join an event and make an impact!`}
          action={<Button to="/events" variant="primary">Explore Causes</Button>}
        />
      ) : (
        <div className="stack" style={{ gap: 'var(--space-6)' }}>
          {/* Top 3 Podium */}
          {top3.length > 0 && (
            <div className="podium-grid">
              {/* 2nd Place (Silver) */}
              {top3[1] && (
                <Card
                  className={`podium-card podium-card--silver stack ${user?.id === top3[1].userId ? 'podium-card--me' : ''}`}
                  style={{ order: 1 }}
                >
                  <div className="podium-badge" aria-label="2nd Place Silver">
                    <Medal size={22} className="silver-icon" aria-hidden="true" />
                    <span>2nd Place (Silver)</span>
                  </div>
                  <div className="avatar avatar--lg">{initials(top3[1].name)}</div>
                  <h3 className="truncate" style={{ margin: 'var(--space-2) 0 4px', fontSize: 'var(--fs-lg)' }}>
                    {top3[1].name}
                  </h3>
                  <Badge variant="eco">{top3[1].level}</Badge>
                  <div className="podium-points">
                    <span className="points-num">{top3[1].points}</span>
                    <span className="muted" style={{ fontSize: 'var(--fs-xs)' }}>points</span>
                  </div>
                  <div className="row muted" style={{ fontSize: 'var(--fs-xs)', gap: 'var(--space-3)', justifyContent: 'center' }}>
                    <span>{top3[1].eventsCompleted} causes</span>
                    <span>•</span>
                    <span>{top3[1].verifiedImpactTotal} kg/trees</span>
                  </div>
                </Card>
              )}

              {/* 1st Place (Gold) */}
              {top3[0] && (
                <Card
                  className={`podium-card podium-card--gold stack ${user?.id === top3[0].userId ? 'podium-card--me' : ''}`}
                  style={{ order: 0 }}
                >
                  <div className="podium-badge podium-badge--first" aria-label="1st Place Gold Champion">
                    <Crown size={26} className="gold-icon" aria-hidden="true" />
                    <span>1st Place (Gold Champion)</span>
                  </div>
                  <div className="avatar avatar--xl avatar--gold">{initials(top3[0].name)}</div>
                  <h3 className="truncate" style={{ margin: 'var(--space-2) 0 4px', fontSize: 'var(--fs-xl)', fontWeight: 'var(--fw-bold)' }}>
                    {top3[0].name}
                  </h3>
                  <Badge variant="accent">{top3[0].level}</Badge>
                  <div className="podium-points">
                    <span className="points-num" style={{ fontSize: 'var(--fs-3xl)', color: 'var(--color-primary)' }}>
                      {top3[0].points}
                    </span>
                    <span className="muted" style={{ fontSize: 'var(--fs-xs)' }}>points</span>
                  </div>
                  <div className="row muted" style={{ fontSize: 'var(--fs-xs)', gap: 'var(--space-3)', justifyContent: 'center' }}>
                    <span>{top3[0].eventsCompleted} causes completed</span>
                    <span>•</span>
                    <span>{top3[0].verifiedImpactTotal} verified impact</span>
                  </div>
                </Card>
              )}

              {/* 3rd Place (Bronze) */}
              {top3[2] && (
                <Card
                  className={`podium-card podium-card--bronze stack ${user?.id === top3[2].userId ? 'podium-card--me' : ''}`}
                  style={{ order: 2 }}
                >
                  <div className="podium-badge" aria-label="3rd Place Bronze">
                    <Medal size={20} className="bronze-icon" aria-hidden="true" />
                    <span>3rd Place (Bronze)</span>
                  </div>
                  <div className="avatar avatar--lg">{initials(top3[2].name)}</div>
                  <h3 className="truncate" style={{ margin: 'var(--space-2) 0 4px', fontSize: 'var(--fs-lg)' }}>
                    {top3[2].name}
                  </h3>
                  <Badge variant="eco">{top3[2].level}</Badge>
                  <div className="podium-points">
                    <span className="points-num">{top3[2].points}</span>
                    <span className="muted" style={{ fontSize: 'var(--fs-xs)' }}>points</span>
                  </div>
                  <div className="row muted" style={{ fontSize: 'var(--fs-xs)', gap: 'var(--space-3)', justifyContent: 'center' }}>
                    <span>{top3[2].eventsCompleted} causes</span>
                    <span>•</span>
                    <span>{top3[2].verifiedImpactTotal} kg/trees</span>
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* Table for remaining ranks */}
          {rest.length > 0 && (
            <Card className="table-wrapper" style={{ padding: 0 }}>
              <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--color-surface-2)', borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>
                    <th style={{ padding: 'var(--space-3)', width: '70px' }}>Rank</th>
                    <th style={{ padding: 'var(--space-3)' }}>Volunteer</th>
                    <th style={{ padding: 'var(--space-3)' }}>Level</th>
                    <th style={{ padding: 'var(--space-3)', textAlign: 'center' }}>Causes</th>
                    <th style={{ padding: 'var(--space-3)', textAlign: 'center' }}>Impact</th>
                    <th style={{ padding: 'var(--space-3)', textAlign: 'right' }}>Points</th>
                  </tr>
                </thead>
                <tbody>
                  {rest.map((entry) => {
                    const isMe = user?.id === entry.userId;
                    return (
                      <tr
                        key={entry.userId}
                        style={{
                          borderBottom: '1px solid var(--color-border)',
                          background: isMe ? 'var(--color-primary-soft)' : 'transparent',
                          fontWeight: isMe ? 'var(--fw-bold)' : 'normal',
                        }}
                      >
                        <td style={{ padding: 'var(--space-3)' }}>
                          <span className="rank-pill">#{entry.rank}</span>
                        </td>
                        <td style={{ padding: 'var(--space-3)' }}>
                          <div className="row" style={{ gap: 'var(--space-2)', alignItems: 'center' }}>
                            <span className="avatar avatar--sm">{initials(entry.name)}</span>
                            <span>{entry.name} {isMe && <Badge variant="primary" size="sm">You</Badge>}</span>
                          </div>
                        </td>
                        <td style={{ padding: 'var(--space-3)' }}>
                          <Badge variant="eco">{entry.level}</Badge>
                        </td>
                        <td style={{ padding: 'var(--space-3)', textAlign: 'center' }}>
                          {entry.eventsCompleted}
                        </td>
                        <td style={{ padding: 'var(--space-3)', textAlign: 'center' }}>
                          {entry.verifiedImpactTotal > 0 ? `${entry.verifiedImpactTotal} total` : '—'}
                        </td>
                        <td style={{ padding: 'var(--space-3)', textAlign: 'right', fontWeight: 'var(--fw-bold)' }}>
                          {entry.points} pts
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Card>
          )}
        </div>
      )}

      {/* Sticky "Your Rank" bar for signed in volunteers */}
      {user?.role === 'VOLUNTEER' && myRank?.rank && (
        <aside className="sticky-rank-bar" aria-label="Your current rank">
          <div className="container row row--between" style={{ alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
            <div className="row" style={{ gap: 'var(--space-3)', alignItems: 'center' }}>
              <div className="rank-badge">#{myRank.rank}</div>
              <div>
                <strong style={{ fontSize: 'var(--fs-md)' }}>Your Standing</strong>
                <div className="muted" style={{ fontSize: 'var(--fs-xs)' }}>
                  {myRank.points} points earned across your causes
                </div>
              </div>
            </div>
            <div className="row" style={{ gap: 'var(--space-3)', alignItems: 'center' }}>
              {myRank.rank > 1 && myRank.pointsToNext != null && (
                <span className="muted" style={{ fontSize: 'var(--fs-sm)' }}>
                  <Zap size={15} style={{ verticalAlign: 'middle', color: 'var(--color-accent)' }} />{' '}
                  <strong>{myRank.pointsToNext} pts</strong> to reach rank #{myRank.rank - 1}
                </span>
              )}
              <Button to="/my-events" variant="secondary" size="sm">
                View My Causes
              </Button>
            </div>
          </div>
        </aside>
      )}
    </div>
  );
}
