import { Circle, Popup } from 'react-leaflet';

export default function SafeZoneCircle({ center, radius, name }) {
  return (
    <Circle
      center={[center.lat, center.lng]}
      radius={radius}
      pathOptions={{
        color: '#3b82f6',
        fillColor: '#3b82f6',
        fillOpacity: 0.15,
        weight: 2,
        opacity: 0.7,
      }}
    >
      <Popup>
        <div style={{ color: '#1f2937', fontSize: '13px' }}>
          <p style={{ fontWeight: 700, margin: 0 }}>{name}</p>
          <p style={{ margin: 0, color: '#6b7280' }}>Radius: {radius}m</p>
        </div>
      </Popup>
    </Circle>
  );
}
