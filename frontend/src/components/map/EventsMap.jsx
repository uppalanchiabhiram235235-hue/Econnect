import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Link } from 'react-router-dom';
import { Calendar, Users, ArrowRight } from 'lucide-react';
import { OSM_TILES_URL, OSM_ATTRIBUTION, createEventPinIcon } from '../../lib/leafletSetup';
import { formatDate } from '../../lib/format';
import Badge from '../Badge';

function FitBounds({ events }) {
  const map = useMap();

  useEffect(() => {
    if (!events || events.length === 0) return;
    const valid = events.filter((e) => e.latitude != null && e.longitude != null);
    if (valid.length === 0) return;

    if (valid.length === 1) {
      map.setView([Number(valid[0].latitude), Number(valid[0].longitude)], 14);
    } else {
      const bounds = L.latLngBounds(valid.map((e) => [Number(e.latitude), Number(e.longitude)]));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    }
  }, [events, map]);

  return null;
}

export default function EventsMap({ events = [] }) {
  const eventsWithCoords = events.filter((e) => e.latitude != null && e.longitude != null);

  // Default fallback center (e.g. Hyderabad / India center if no coordinates)
  const defaultCenter = eventsWithCoords.length > 0
    ? [Number(eventsWithCoords[0].latitude), Number(eventsWithCoords[0].longitude)]
    : [17.385044, 78.486671];

  return (
    <div className="map-view-wrapper">
      {eventsWithCoords.length === 0 && (
        <div className="map-empty-overlay">
          No events currently have coordinates to display on the map.
        </div>
      )}

      <MapContainer
        center={defaultCenter}
        zoom={eventsWithCoords.length > 0 ? 12 : 5}
        scrollWheelZoom={false}
      >
        <TileLayer url={OSM_TILES_URL} attribution={OSM_ATTRIBUTION} />
        <FitBounds events={eventsWithCoords} />

        {eventsWithCoords.map((e) => (
          <Marker
            key={e.id}
            position={[Number(e.latitude), Number(e.longitude)]}
            icon={createEventPinIcon(e.eventType)}
          >
            <Popup>
              <div style={{ minWidth: '180px', padding: '4px' }}>
                <Badge variant="type" style={{ marginBottom: '6px' }}>
                  {e.eventTypeLabel || e.eventType}
                </Badge>
                <h4 style={{ margin: '0 0 6px', fontSize: '1rem' }}>{e.title}</h4>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  <Calendar size={13} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                  {formatDate(e.eventDate)}
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
                  <Users size={13} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                  {e.remainingSlots ?? (e.maxVolunteers - (e.currentParticipants || 0))} slots left
                </div>
                {e.distanceKm != null && (
                  <div style={{ fontSize: '0.82rem', color: 'var(--primary)', fontWeight: 700, marginBottom: '8px' }}>
                    📍 {e.distanceKm} km away
                  </div>
                )}
                <Link
                  to={`/events/${e.id}`}
                  className="btn btn--primary btn--sm"
                  style={{ width: '100%', textDecoration: 'none' }}
                >
                  View Details <ArrowRight size={14} />
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
