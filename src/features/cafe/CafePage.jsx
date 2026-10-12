import { useEffect, useMemo, useRef, useState } from 'react';
import Button from '../../components/Button';
import styles from './CafePage.module.css';

const studySpaces = [
  {
    id: 'space-1',
    name: 'University Library - 4th Floor',
    category: 'silent',
    categoryLabel: 'Silent Study',
    description: 'Quiet study tables, private carrels, and individual power outlets.',
    location: 'North Campus · Main Library',
    lat: 30.7672,
    lng: 76.5754,
    amenities: ['Individual study desks', 'Power at every seat', 'Silent zone']
  },
  {
    id: 'space-2',
    name: 'Student Union Commons',
    category: 'group',
    categoryLabel: 'Group Discussion',
    description: 'Open collaborative space with whiteboard tables and cafe counter.',
    location: 'Central Campus · Student Union Level 2',
    lat: 30.7685,
    lng: 76.5762,
    amenities: ['Whiteboard tables', 'Group booths', 'Power strips']
  },
  {
    id: 'space-3',
    name: 'Engineering Innovation Atrium',
    category: 'projects',
    categoryLabel: 'Project Labs',
    description: 'High-ceiling open workspace for hardware teams and group presentations.',
    location: 'South Campus · Engineering Complex',
    lat: 30.7659,
    lng: 76.5741,
    amenities: ['Large project tables', 'Presentation screens', 'Evening access']
  },
  {
    id: 'space-4',
    name: 'Campus Perimeter Cafe',
    category: 'cafe',
    categoryLabel: 'Coffee & Work',
    description: 'Casual coffee shop with reliable campus Wi-Fi and ample seating.',
    location: 'East Gate · University Blvd',
    lat: 30.7691,
    lng: 76.5788,
    amenities: ['Coffee & snacks', 'Indoor/outdoor seating', 'Campus Wi-Fi']
  }
];

const filters = [
  { label: 'All Spaces', value: 'all' },
  { label: 'Silent Study', value: 'silent' },
  { label: 'Group Discussion', value: 'group' },
  { label: 'Project Labs', value: 'projects' },
  { label: 'Coffee & Work', value: 'cafe' }
];

const CafePage = () => {
  const [activeSpot, setActiveSpot] = useState(studySpaces[0]);
  const [filter, setFilter] = useState('all');
  const [copied, setCopied] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(false);

  const mapContainerRef = useRef(null);
  const googleMapRef = useRef(null);
  const markersRef = useRef([]);

  const mapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_KEY;
  const isKeyConfigured = Boolean(
    mapsApiKey &&
    mapsApiKey !== 'your_google_maps_api_key_here' &&
    mapsApiKey !== 'your_key_here'
  );

  // Load Google Maps SDK if API key is present
  useEffect(() => {
    if (!isKeyConfigured) return;

    if (window.google?.maps) {
      setMapLoaded(true);
      return;
    }

    const scriptId = 'google-maps-script';
    if (document.getElementById(scriptId)) return;

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(mapsApiKey)}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => setMapLoaded(true);
    script.onerror = () => setMapError(true);
    document.head.appendChild(script);
  }, [isKeyConfigured, mapsApiKey]);

  // Initialize or update Map
  useEffect(() => {
    if (!mapLoaded || !window.google?.maps || !mapContainerRef.current) return;

    try {
      if (!googleMapRef.current) {
        googleMapRef.current = new window.google.maps.Map(mapContainerRef.current, {
          center: { lat: activeSpot.lat, lng: activeSpot.lng },
          zoom: 16,
          disableDefaultUI: false,
          zoomControl: true,
          streetViewControl: false,
          styles: [
            { featureType: 'poi.school', elementType: 'geometry', stylers: [{ color: '#f1f5f9' }] }
          ]
        });
      }

      // Clear existing markers
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current = [];

      // Add markers for all spots
      studySpaces.forEach((spot) => {
        const marker = new window.google.maps.Marker({
          position: { lat: spot.lat, lng: spot.lng },
          map: googleMapRef.current,
          title: spot.name,
          animation: spot.id === activeSpot.id ? window.google.maps.Animation.BOUNCE : undefined
        });

        marker.addListener('click', () => {
          setActiveSpot(spot);
        });

        markersRef.current.push(marker);
      });

      // Pan to active spot
      googleMapRef.current.panTo({ lat: activeSpot.lat, lng: activeSpot.lng });
    } catch (err) {
      console.error('Google Maps render error:', err);
      setMapError(true);
    }
  }, [mapLoaded, activeSpot]);

  const filteredSpots = useMemo(() => {
    if (filter === 'all') return studySpaces;
    return studySpaces.filter((spot) => spot.category === filter);
  }, [filter]);

  const handleCopy = () => {
    const text = `${activeSpot.name}\n${activeSpot.location}\n${activeSpot.description}\nAmenities: ${activeSpot.amenities.join(', ')}`;
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <span className={styles.eyebrow}>Campus Study Spaces</span>
        <h1>Study Spaces & Meeting Locations</h1>
        <p className={styles.lead}>
          Directory of verified campus study areas, library lounges, and group workspaces suitable
          for coursework, exam preparation, and project meetings.
        </p>
      </header>

      <div className={styles.grid}>
        <div className={styles.mapPanel}>
          {isKeyConfigured && !mapError ? (
            <div
              ref={mapContainerRef}
              className={styles.mapShell}
              style={{ minHeight: '260px' }}
            />
          ) : (
            <div className={styles.mapShell}>
              <div className={styles.mapPinIcon}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <div className={styles.centerText}>
                <span className={styles.location}>{activeSpot.name}</span>
                <span className={styles.coords}>{activeSpot.location} ({activeSpot.lat}, {activeSpot.lng})</span>
                <span className={styles.configNotice}>
                  Interactive Map requires <code>VITE_GOOGLE_MAPS_KEY</code> in <code>.env</code>
                </span>
              </div>
            </div>
          )}

          <div className={styles.mapSummary}>
            <span className={styles.summaryTitle}>Space Details</span>
            <p className={styles.summaryDetail}>{activeSpot.description}</p>
            <div className={styles.amenitiesSection}>
              <span className={styles.amenityLabel}>Amenities</span>
              <ul className={styles.highlights}>
                {activeSpot.amenities.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <Button
              variant="ghost"
              type="button"
              className={styles.mapButton}
              onClick={handleCopy}
            >
              {copied ? 'Copied to Clipboard!' : 'Copy Space Info'}
            </Button>
          </div>
        </div>

        <div className={styles.spotPanel}>
          <div className={styles.filterBar}>
            {filters.map((chip) => (
              <button
                key={chip.value}
                type="button"
                className={[styles.filterChip, filter === chip.value ? styles.active : '']
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => setFilter(chip.value)}
              >
                {chip.label}
              </button>
            ))}
          </div>

          <div className={styles.spotList}>
            {filteredSpots.map((spot) => (
              <article
                key={spot.id}
                className={[styles.spotCard, spot.id === activeSpot.id ? styles.selected : '']
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => setActiveSpot(spot)}
              >
                <div>
                  <h3>{spot.name}</h3>
                  <p className={styles.spotLocation}>{spot.location}</p>
                </div>
                <span className={styles.badge}>{spot.categoryLabel}</span>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CafePage;
