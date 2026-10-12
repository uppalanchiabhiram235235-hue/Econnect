import { useState, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import { Locate, X, MapPin } from 'lucide-react';
import { OSM_TILES_URL, OSM_ATTRIBUTION } from '../../lib/leafletSetup';
import Button from '../Button';

function MapClickHandler({ onLocationSelect }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function PanToLocation({ lat, lng }) {
  const map = useMap();
  if (lat != null && lng != null) {
    map.setView([lat, lng], map.getZoom());
  }
  return null;
}

export default function LocationPickerMap({ latitude, longitude, onChange }) {
  const [locating, setLocating] = useState(false);
  const markerRef = useRef(null);

  const hasCoords = latitude != null && longitude != null;
  const currentPos = useMemo(() => {
    return hasCoords ? [Number(latitude), Number(longitude)] : [17.385044, 78.486671];
  }, [hasCoords, latitude, longitude]);

  const handleDragEnd = () => {
    const marker = markerRef.current;
    if (marker != null) {
      const latlng = marker.getLatLng();
      onChange(Number(latlng.lat.toFixed(6)), Number(latlng.lng.toFixed(6)));
    }
  };

  const handleMapClick = (lat, lng) => {
    onChange(Number(lat.toFixed(6)), Number(lng.toFixed(6)));
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        onChange(
          Number(pos.coords.latitude.toFixed(6)),
          Number(pos.coords.longitude.toFixed(6))
        );
      },
      (err) => {
        setLocating(false);
        alert('Could not retrieve your location: ' + err.message);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleClear = () => {
    onChange(null, null);
  };

  return (
    <div className="stack" style={{ gap: 'var(--space-2)' }}>
      <div className="row row--between">
        <label style={{ fontWeight: 700, fontSize: 'var(--fs-sm)' }}>
          <MapPin size={15} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
          Pick Location on Map <span className="muted">(Optional)</span>
        </label>
        <div className="row" style={{ gap: 'var(--space-2)' }}>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleUseCurrentLocation}
            disabled={locating}
          >
            <Locate size={14} /> {locating ? 'Locating...' : 'Use My Current Location'}
          </Button>
          {hasCoords && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
            >
              <X size={14} /> Clear Coordinates
            </Button>
          )}
        </div>
      </div>

      <p className="field__hint" style={{ margin: 0 }}>
        Click on the map or drag the marker to pinpoint the exact venue coordinates.
      </p>

      <div className="map-picker-wrapper">
        <MapContainer
          center={currentPos}
          zoom={hasCoords ? 14 : 5}
          scrollWheelZoom={false}
        >
          <TileLayer url={OSM_TILES_URL} attribution={OSM_ATTRIBUTION} />
          <MapClickHandler onLocationSelect={handleMapClick} />
          {hasCoords && <PanToLocation lat={Number(latitude)} lng={Number(longitude)} />}

          {hasCoords && (
            <Marker
              draggable
              eventHandlers={{ dragend: handleDragEnd }}
              position={currentPos}
              ref={markerRef}
            />
          )}
        </MapContainer>
      </div>

      {hasCoords && (
        <div className="row" style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', gap: 'var(--space-4)' }}>
          <span>Latitude: <strong>{Number(latitude).toFixed(6)}</strong></span>
          <span>Longitude: <strong>{Number(longitude).toFixed(6)}</strong></span>
        </div>
      )}
    </div>
  );
}
