import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import './Map.css';

const Map = ({
  latitude,
  longitude,
  businesses = [],
  interactive = true,
  className = '',
  height = '400px'
}) => {
  const mapRef = useRef(null);
  const { showToast } = useApp();
  const [mapError, setMapError] = useState(false);

  useEffect(() => {
    if (!latitude || !longitude || mapError) {
      return;
    }

    const loadMap = async () => {
      try {
        // In a real implementation, you would use a mapping library like Leaflet or Google Maps
        // This is a simplified placeholder implementation
        const mapElement = mapRef.current;
        if (!mapElement) return;

        // Clear previous content
        mapElement.innerHTML = '';

        // Create a simple map representation
        const mapContent = document.createElement('div');
        mapContent.className = 'ui-map__placeholder';

        const coordinates = document.createElement('div');
        coordinates.className = 'ui-map__coordinates';
        coordinates.textContent = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;

        const locationText = document.createElement('div');
        locationText.className = 'ui-map__location-text';
        locationText.textContent = 'Map Location';

        mapContent.appendChild(coordinates);
        mapContent.appendChild(locationText);
        mapElement.appendChild(mapContent);

        // Add markers for businesses if provided
        if (businesses.length > 0) {
          const markersContainer = document.createElement('div');
          markersContainer.className = 'ui-map__markers';

          businesses.forEach(business => {
            if (business.latitude && business.longitude) {
              const marker = document.createElement('div');
              marker.className = 'ui-map__marker';
              marker.title = business.name;
              markersContainer.appendChild(marker);
            }
          });

          mapElement.appendChild(markersContainer);
        }

      } catch (error) {
        console.error('Map loading error:', error);
        setMapError(true);
        showToast('Failed to load map', 'error');
      }
    };

    loadMap();
  }, [latitude, longitude, businesses, mapError, showToast]);

  if (!latitude || !longitude) {
    return (
      <div className="ui-map ui-map--error">
        <div className="ui-map__error">
          <div className="ui-map__error-icon">🗺️</div>
          <p className="ui-map__error-text">Location data not available</p>
        </div>
      </div>
    );
  }

  if (mapError) {
    return (
      <div className="ui-map ui-map--error">
        <div className="ui-map__error">
          <div className="ui-map__error-icon">⚠️</div>
          <p className="ui-map__error-text">Failed to load map</p>
          <button
            className="ui-map__retry"
            onClick={() => setMapError(false)}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`ui-map ${interactive ? 'ui-map--interactive' : ''} ${className}`}
      style={{ height }}
      ref={mapRef}
    />
  );
};

export default Map;