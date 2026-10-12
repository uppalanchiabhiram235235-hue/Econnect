import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Award, CheckCircle, Leaf, Printer, ShieldCheck, Sparkles, ExternalLink } from 'lucide-react';
import { api } from '../lib/api';
import { useToast } from '../components/Toast';
import { formatDate } from '../lib/format';
import Button from '../components/Button';
import Skeleton from '../components/Skeleton';

export default function Certificate() {
  const { participationId } = useParams();
  const toast = useToast();

  const [cert, setCert] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get(`/participation/${participationId}/certificate`)
      .then((data) => setCert(data))
      .catch((err) => {
        toast.error(err.message || 'Failed to load certificate');
      })
      .finally(() => setLoading(false));
  }, [participationId]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="container page" style={{ textAlign: 'center' }}>
        <Skeleton height="40px" width="300px" style={{ margin: '0 auto var(--space-4)' }} />
        <Skeleton height="500px" />
      </div>
    );
  }

  if (!cert || !cert.valid) {
    return (
      <div className="container page" style={{ textAlign: 'center', padding: 'var(--space-7) 0' }}>
        <Award size={48} className="muted" style={{ margin: '0 auto var(--space-3)' }} />
        <h2>Certificate Unavailable</h2>
        <p className="muted" style={{ maxWidth: '44ch', margin: '0 auto var(--space-5)' }}>
          Certificates are only issued for events you have attended and officially completed.
        </p>
        <Button to="/my-events" variant="primary">Return to My Events</Button>
      </div>
    );
  }

  const verifyUrl = `${window.location.origin}/verify/${cert.certificateCode}`;

  return (
    <div className="container page certificate-page">
      {/* Chrome Screen Header (hidden on print) */}
      <div className="row row--between no-print" style={{ marginBottom: 'var(--space-4)', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
        <Link to="/my-events" className="btn btn--ghost btn--sm">
          <ArrowLeft size={16} /> Back to My Causes
        </Link>
        <Button onClick={handlePrint} variant="primary">
          <Printer size={18} /> Print / Save as PDF
        </Button>
      </div>

      {/* Printable Certificate Frame */}
      <div className="certificate-frame">
        <div className="certificate-inner">
          {/* Header */}
          <div className="certificate-header">
            <div className="certificate-brand">
              <Leaf size={28} className="brand-leaf" aria-hidden="true" />
              <span>ECONNECT</span>
            </div>
            <span className="certificate-tagline">Community Clean-Up & Cause Coordinator</span>
          </div>

          <div className="certificate-title-section">
            <span className="certificate-supertitle">CERTIFICATE OF RECOGNITION</span>
            <div className="certificate-divider" />
            <p className="certificate-present-to">This certificate is proudly presented to</p>
            <h1 className="certificate-recipient">{cert.volunteerName}</h1>
            <p className="certificate-citation">
              for exemplary community service and active participation in making a cleaner, greener, and more sustainable world through
            </p>
            <h2 className="certificate-event">{cert.eventTitle}</h2>
          </div>

          {/* Details Grid */}
          <div className="certificate-details">
            <div className="certificate-col">
              <span className="certificate-col-title">Cause & Location</span>
              <strong>{cert.eventTypeLabel || cert.eventType}</strong>
              <span>{cert.location}</span>
            </div>

            <div className="certificate-col">
              <span className="certificate-col-title">Date & Service</span>
              <strong>{formatDate(cert.eventDate)}</strong>
              <span>{cert.hours > 0 ? `${cert.hours} Hours Volunteered` : 'Dedicated Cause Service'}</span>
            </div>

            <div className="certificate-col">
              <span className="certificate-col-title">Organized By</span>
              <strong>{cert.organizerName}</strong>
              <span>Verified Event Coordinator</span>
            </div>
          </div>

          {/* Verified Impact Section */}
          {cert.verifiedImpactLines && cert.verifiedImpactLines.length > 0 && (
            <div className="certificate-impact">
              <span className="certificate-col-title">Verified Impact Achieved:</span>
              <div className="row" style={{ gap: 'var(--space-2)', flexWrap: 'wrap', justifyContent: 'center', marginTop: '4px' }}>
                {cert.verifiedImpactLines.map((line, idx) => (
                  <span key={idx} className="certificate-impact-pill">
                    <CheckCircle size={13} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                    {line}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Verification Footer */}
          <div className="certificate-footer">
            <div className="certificate-code-block">
              <span className="certificate-code-label">CERTIFICATE IDENTIFIER</span>
              <code className="certificate-code">{cert.certificateCode}</code>
            </div>

            <div className="certificate-seal">
              <ShieldCheck size={36} aria-hidden="true" />
              <span>VERIFIED CAUSE</span>
            </div>

            <div className="certificate-verify-block">
              <span className="certificate-code-label">PUBLIC VERIFICATION LINK</span>
              <a href={verifyUrl} target="_blank" rel="noreferrer" className="certificate-url">
                {verifyUrl}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
