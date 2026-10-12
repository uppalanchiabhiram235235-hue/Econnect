import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import { Navigation, ExternalLink } from 'lucide-react';
import { OSM_TILES_URL, OSM_ATTRIBUTION, createEventPinIcon } from '../../lib/leafletSetup';

export default function EventStaticMap({ latitude, longitude, eventType, locationTitle }) {
  if (latitude == null || longitude == null) return null;

  const lat = Number(latitude);
  const lng = Number(longitude);
  const directionsUrl = `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=;${lat}%2C${lng}`;

  return (
    <div className="card" style={{ padding: 'var(--space-4)', marginTop: 'var(--space-4)' }}>
      <div className="row row--between" style={{ marginBottom: 'var(--space-2)' }}>
        <h4 style={{ margin: 0, fontSize: 'var(--fs-md)' }}>Event Location</h4>
        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn--outline btn--sm"
          style={{ textDecoration: 'none' }}
        >
          <Navigation size={14} /> Get Directions <ExternalLink size={12} />
        </a>
      </div>

      <div className="map-mini-wrapper">
        <MapContainer
          center={[lat, lng]}
          zoom={15}
          scrollWheelZoom={false}
          dragging={false}
          zoomControl={false}
        >
          <TileLayer url={OSM_TILES_URL} attribution={OSM_ATTRIBUTION} />
          <Marker position={[lat, lng]} icon={createEventPinIcon(eventType)} />
        </MapContainer>
      </div>

      <div className="muted" style={{ fontSize: 'var(--fs-xs)', marginTop: 'var(--space-2)' }}>
        Coordinates: {lat.toFixed(6)}, {lng.toFixed(6)}
      </div>
    </div>
  );
}
