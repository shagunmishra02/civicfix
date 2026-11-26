import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Complaint } from '../types';
import { CAMPUS_CENTER } from '../utils/campusLocations';

interface CampusMapProps {
  mode?: 'picker' | 'view';
  complaints?: Complaint[];
  selectedLocation?: { lat: number; lng: number } | null;
  onLocationSelect?: (loc: { lat: number; lng: number }) => void;
  onSelectComplaint?: (complaintId: string) => void;
  height?: string;
}

export const CampusMap: React.FC<CampusMapProps> = ({
  mode = 'view',
  complaints = [],
  selectedLocation = null,
  onLocationSelect,
  onSelectComplaint,
  height = '420px',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const pickerMarkerRef = useRef<L.Marker | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const initialCenter = selectedLocation
      ? [selectedLocation.lat, selectedLocation.lng] as [number, number]
      : CAMPUS_CENTER;

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: 16,
      zoomControl: true,
    });

    // OpenStreetMap high quality tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    const markersGroup = L.layerGroup().addTo(map);
    markersLayerRef.current = markersGroup;
    mapInstanceRef.current = map;

    // In picker mode, listen for map clicks
    if (mode === 'picker' && onLocationSelect) {
      map.on('click', (e: L.LeafletMouseEvent) => {
        onLocationSelect({ lat: e.latlng.lat, lng: e.latlng.lng });
      });
    }

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [mode]);

  // Update picker marker when selectedLocation changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || mode !== 'picker') return;

    if (pickerMarkerRef.current) {
      pickerMarkerRef.current.remove();
      pickerMarkerRef.current = null;
    }

    if (selectedLocation) {
      const pinIcon = L.divIcon({
        className: 'custom-pin-picker',
        html: `
          <div style="
            width: 32px;
            height: 32px;
            background: #2563eb;
            color: white;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 8px rgba(0,0,0,0.3);
            border: 2px solid white;
          ">
            <span style="transform: rotate(45deg); font-size: 14px; font-weight: bold;">📍</span>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      });

      const marker = L.marker([selectedLocation.lat, selectedLocation.lng], {
        icon: pinIcon,
        draggable: true,
      }).addTo(map);

      marker.on('dragend', (e: any) => {
        const latlng = e.target.getLatLng();
        if (onLocationSelect) {
          onLocationSelect({ lat: latlng.lat, lng: latlng.lng });
        }
      });

      pickerMarkerRef.current = marker;
      map.panTo([selectedLocation.lat, selectedLocation.lng]);
    }
  }, [selectedLocation, mode, onLocationSelect]);

  // Update complaints markers in view mode
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersLayerRef.current;
    if (!map || !markersGroup || mode !== 'view') return;

    markersGroup.clearLayers();

    complaints.forEach((item) => {
      let pinColor = '#e11d48'; // Red for Reported
      if (item.status === 'In Progress' || item.status === 'Assigned') {
        pinColor = '#d97706'; // Amber
      } else if (item.status === 'Resolved') {
        pinColor = '#059669'; // Green
      }

      const icon = L.divIcon({
        className: 'custom-map-pin-container',
        html: `
          <div style="
            width: 28px;
            height: 28px;
            background: ${pinColor};
            border: 2px solid white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 11px;
            font-weight: 700;
            box-shadow: 0 4px 6px rgba(0,0,0,0.25);
            cursor: pointer;
          ">
            ${item.upvotes || 1}
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const marker = L.marker([item.latitude, item.longitude], { icon }).addTo(markersGroup);

      // Secure DOM-based Popup Creation (prevents Stored XSS)
      const popupDiv = document.createElement('div');
      popupDiv.style.width = '240px';
      popupDiv.style.fontFamily = 'inherit';

      if (item.image_url) {
        // Only allow safe http/https or /uploads/ URLs
        const safeUrl = (item.image_url.startsWith('http://') || item.image_url.startsWith('https://') || item.image_url.startsWith('/uploads/'))
          ? item.image_url
          : '';
        if (safeUrl) {
          const imgContainer = document.createElement('div');
          imgContainer.style.cssText = 'height: 100px; width: 100%; background: #eee; overflow: hidden;';
          const img = document.createElement('img');
          img.src = safeUrl;
          img.style.cssText = 'width: 100%; height: 100%; object-fit: cover;';
          imgContainer.appendChild(img);
          popupDiv.appendChild(imgContainer);
        }
      }

      const contentDiv = document.createElement('div');
      contentDiv.style.padding = '12px';

      const topRow = document.createElement('div');
      topRow.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;';

      const idSpan = document.createElement('span');
      idSpan.style.cssText = 'font-size: 11px; font-weight: bold; color: #64748b;';
      idSpan.textContent = item.id;
      topRow.appendChild(idSpan);

      const statusSpan = document.createElement('span');
      statusSpan.style.cssText = `font-size: 10px; padding: 2px 6px; border-radius: 4px; background: ${
        item.status === 'Resolved' ? '#dcfce7; color: #166534;' : '#fee2e2; color: #991b1b;'
      }; font-weight: 600;`;
      statusSpan.textContent = item.status;
      topRow.appendChild(statusSpan);
      contentDiv.appendChild(topRow);

      const titleH4 = document.createElement('h4');
      titleH4.style.cssText = 'font-size: 13px; font-weight: 700; color: #0f172a; margin: 0 0 4px 0;';
      titleH4.textContent = item.title;
      contentDiv.appendChild(titleH4);

      const locP = document.createElement('p');
      locP.style.cssText = 'font-size: 11px; color: #475569; margin: 0 0 8px 0;';
      locP.textContent = `📍 ${item.location_name}`;
      contentDiv.appendChild(locP);

      const bottomRow = document.createElement('div');
      bottomRow.style.cssText = 'display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #e2e8f0; padding-top: 8px; margin-top: 8px;';

      const upvotesSpan = document.createElement('span');
      upvotesSpan.style.cssText = 'font-size: 11px; color: #64748b;';
      upvotesSpan.textContent = `👍 ${item.upvotes} impacted`;
      bottomRow.appendChild(upvotesSpan);

      const btn = document.createElement('button');
      btn.style.cssText = 'background: #2563eb; color: white; border: none; padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; cursor: pointer;';
      btn.textContent = 'Details →';
      if (onSelectComplaint) {
        btn.onclick = () => onSelectComplaint(item.id);
      }
      bottomRow.appendChild(btn);
      contentDiv.appendChild(bottomRow);

      popupDiv.appendChild(contentDiv);
      marker.bindPopup(popupDiv);
    });
  }, [complaints, mode, onSelectComplaint]);

  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-inner">
      <div ref={mapContainerRef} style={{ height, width: '100%' }} />
      {mode === 'picker' && (
        <div className="absolute top-3 left-3 z-[1000] bg-white/95 backdrop-blur px-3 py-1.5 rounded-lg shadow-md border border-slate-200 text-xs font-medium text-slate-700 pointer-events-none flex items-center gap-1.5">
          <span>📍</span> Click anywhere on campus to drop or move pin
        </div>
      )}
    </div>
  );
};
