import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle2, XCircle, ShieldCheck, Calendar, MapPin, User, Clock, ArrowRight, Leaf } from 'lucide-react';
import { api } from '../lib/api';
import { formatDate } from '../lib/format';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Button from '../components/Button';
import Skeleton from '../components/Skeleton';

export default function VerifyCertificate() {
  const { code } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get(`/certificates/verify/${encodeURIComponent(code)}`)
      .then((data) => setResult(data))
      .catch(() => setResult({ valid: false }))
      .finally(() => setLoading(false));
  }, [code]);

  return (
    <div className="container page" style={{ maxWidth: '680px', margin: '0 auto' }}>
      <div className="page__header" style={{ textAlign: 'center' }}>
        <div className="row" style={{ justifyContent: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
          <Leaf size={24} style={{ color: 'var(--color-primary)' }} />
          <span style={{ fontWeight: 'var(--fw-bold)', fontSize: 'var(--fs-lg)' }}>ECONNECT Verification</span>
        </div>
        <h1>Certificate Credential Check</h1>
        <p className="muted">Public verification for community impact and volunteer attendance credentials.</p>
      </div>

      {loading ? (
        <Card className="stack" style={{ gap: 'var(--space-4)', padding: 'var(--space-5)' }}>
          <Skeleton height="60px" />
          <Skeleton height="200px" />
        </Card>
      ) : result && result.valid ? (
        <Card className="stack" style={{ gap: 'var(--space-5)', padding: 'var(--space-5)', borderTop: '4px solid var(--color-primary)' }}>
          <div className="row row--between" style={{ alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
            <div className="row" style={{ gap: 'var(--space-2)', alignItems: 'center' }}>
              <div style={{ color: 'var(--color-primary)' }}>
                <CheckCircle2 size={32} />
              </div>
              <div>
                <h2 style={{ fontSize: 'var(--fs-xl)', margin: 0 }}>Officially Verified</h2>
                <span className="muted" style={{ fontSize: 'var(--fs-xs)' }}>Authentic ECONNECT Volunteer Credential</span>
              </div>
            </div>
            <Badge variant="eco" style={{ padding: '6px 12px' }}>
              <ShieldCheck size={14} style={{ marginRight: '4px' }} />
              VALID
            </Badge>
          </div>

          <div className="stack" style={{ gap: 'var(--space-3)', background: 'var(--color-surface-2)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)' }}>
            <div>
              <span className="muted" style={{ fontSize: 'var(--fs-xs)' }}>Volunteer Recipient</span>
              <div style={{ fontSize: 'var(--fs-xl)', fontWeight: 'var(--fw-bold)', color: 'var(--color-primary)' }}>
                {result.volunteerName}
              </div>
            </div>

            <div>
              <span className="muted" style={{ fontSize: 'var(--fs-xs)' }}>Community Cause</span>
              <div style={{ fontSize: 'var(--fs-md)', fontWeight: 'var(--fw-semibold)' }}>
                {result.eventTitle}
              </div>
            </div>

            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
              <div>
                <span className="muted" style={{ fontSize: 'var(--fs-xs)' }}>Date</span>
                <div style={{ fontSize: 'var(--fs-sm)' }}>{formatDate(result.eventDate)}</div>
              </div>
              <div>
                <span className="muted" style={{ fontSize: 'var(--fs-xs)' }}>Location</span>
                <div style={{ fontSize: 'var(--fs-sm)' }}>{result.location}</div>
              </div>
              <div>
                <span className="muted" style={{ fontSize: 'var(--fs-xs)' }}>Cause Coordinator</span>
                <div style={{ fontSize: 'var(--fs-sm)' }}>{result.organizerName}</div>
              </div>
              {result.hours > 0 && (
                <div>
                  <span className="muted" style={{ fontSize: 'var(--fs-xs)' }}>Service Time</span>
                  <div style={{ fontSize: 'var(--fs-sm)' }}>{result.hours} Hours</div>
                </div>
              )}
            </div>

            {result.verifiedImpactLines && result.verifiedImpactLines.length > 0 && (
              <div style={{ marginTop: 'var(--space-2)', paddingTop: 'var(--space-2)', borderTop: '1px solid var(--color-border)' }}>
                <span className="muted" style={{ fontSize: 'var(--fs-xs)' }}>Verified Impact Recorded</span>
                <ul style={{ margin: '4px 0 0', paddingLeft: '20px', fontSize: 'var(--fs-sm)' }}>
                  {result.verifiedImpactLines.map((line, idx) => (
                    <li key={idx}>{line}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="row row--between muted" style={{ fontSize: 'var(--fs-xs)', alignItems: 'center' }}>
            <span>Identifier: <code>{result.certificateCode}</code></span>
            <span>Issued: {result.issuedAt ? formatDate(result.issuedAt.slice(0, 10)) : 'Verified'}</span>
          </div>
        </Card>
      ) : (
        <Card className="stack" style={{ gap: 'var(--space-4)', padding: 'var(--space-6)', textAlign: 'center' }}>
          <div style={{ color: 'var(--color-danger)', margin: '0 auto' }}>
            <XCircle size={44} />
          </div>
          <div>
            <h2 style={{ fontSize: 'var(--fs-xl)', marginBottom: 'var(--space-2)' }}>Invalid or Unrecognized Code</h2>
            <p className="muted" style={{ maxWidth: '42ch', margin: '0 auto var(--space-4)' }}>
              The certificate code <code>{code}</code> could not be validated. It may be misspelled or reference an uncompleted event.
            </p>
          </div>
          <div className="row" style={{ justifyContent: 'center' }}>
            <Button to="/events" variant="primary">Browse Active Causes</Button>
          </div>
        </Card>
      )}
    </div>
  );
}
