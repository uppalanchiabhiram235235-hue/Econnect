import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { EVENT_TYPES } from './eventMeta';

// Fix the default marker icon path issue for Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

export const OSM_TILES_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
export const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors';

const EVENT_COLOR_HEX = {
  COMMUNITY_CLEANUP: '#2f9e6b',
  BEACH_CLEANUP: '#1e88c7',
  TREE_PLANTING: '#3b7d23',
  WASTE_COLLECTION: '#8a6d3b',
  ENVIRONMENTAL_CAMPAIGN: '#c2562d',
  SOCIAL_CAUSE: '#a14aa8',
  OTHER: '#5f6f7a',
};

/**
 * Creates a modern, SVG-styled colour-coded map pin matching each event type's hue.
 */
export function createEventPinIcon(eventType) {
  const color = EVENT_COLOR_HEX[eventType] || '#1b6b4a';
  const html = `
    <div style="
      background-color: ${color};
      width: 30px;
      height: 30px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 2px solid #ffffff;
      box-shadow: 0 3px 8px rgba(0,0,0,0.35);
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div style="
        width: 10px;
        height: 10px;
        background-color: #ffffff;
        border-radius: 50%;
        transform: rotate(45deg);
      "></div>
    </div>
  `;
  return L.divIcon({
    className: 'custom-event-pin',
    html,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -28],
  });
}
