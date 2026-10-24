import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

export default function MemberMarker({ position, name, lastSeen, color }) {
  // Create a custom colored circle icon with the member's initial
  const icon = L.divIcon({
    className: '', // Remove default leaflet styles
    html: `
      <div style="display:flex;flex-direction:column;align-items:center;">
        <div style="
          width:32px;height:32px;border-radius:50%;
          background:${color};
          border:2px solid #fff;
          display:flex;align-items:center;justify-content:center;
          box-shadow:0 2px 6px rgba(0,0,0,0.4);
          font-size:13px;font-weight:700;color:#fff;
        ">${name.charAt(0).toUpperCase()}</div>
        <div style="
          width:6px;height:10px;margin-top:-2px;
          background:${color};
          clip-path:polygon(0 0, 100% 0, 50% 100%);
        "></div>
      </div>
    `,
    iconSize: [32, 42],
    iconAnchor: [16, 42],
    popupAnchor: [0, -42],
  });

  return (
    <Marker position={[position.lat, position.lng]} icon={icon}>
      <Popup>
        <div style={{ color: '#1f2937', fontSize: '13px' }}>
          <p style={{ fontWeight: 700, margin: 0 }}>{name}</p>
          <p style={{ margin: 0, color: '#6b7280' }}>Last seen: {lastSeen}</p>
        </div>
      </Popup>
    </Marker>
  );
}
