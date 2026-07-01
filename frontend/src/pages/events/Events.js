import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';
import { eventsService } from '../../services/events';
import { formatDate, formatRelativeTime } from '../../utils/helpers';
import { EVENT_TYPES } from '../../utils/constants';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import './Events.css';

const Events = () => {
  const { showToast } = useApp();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const eventsData = await eventsService.getUpcomingEvents();
      setEvents(eventsData);
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.business?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !filterType || event.event_type === filterType;
    return matchesSearch && matchesType;
  });

  const getEventTypeLabel = (type) => {
    return EVENT_TYPES[type.toUpperCase()] || type;
  };

  if (loading) {
    return (
      <div className="events-page">
        <Card>
          <div className="events-loading">Loading events...</div>
        </Card>
      </div>
    );
  }

  return (
    <div className="events-page">
      <div className="events-header">
        <h1>Upcoming Events</h1>
        <p>Discover and join events from local businesses</p>
      </div>

      <div className="events-controls">
        <Input
          placeholder="Search events or businesses..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="events-search"
        />

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="events-filter"
        >
          <option value="">All Event Types</option>
          {Object.entries(EVENT_TYPES).map(([key, value]) => (
            <option key={key} value={value}>
              {key.charAt(0) + key.slice(1).toLowerCase().replace('_', ' ')}
            </option>
          ))}
        </select>
      </div>

      {filteredEvents.length === 0 ? (
        <Card className="events-empty">
          <div className="events-empty__content">
            <h3>No events found</h3>
            <p>
              {searchTerm || filterType
                ? 'Try adjusting your search criteria'
                : 'No upcoming events at the moment'
              }
            </p>
          </div>
        </Card>
      ) : (
        <div className="events-grid">
          {filteredEvents.map(event => (
            <Card key={event.id} className="event-card" onClick={() => window.location.href = `/events/${event.id}`}>
              <div className="event-card__header">
                <span className={`event-type event-type--${event.event_type}`}>
                  {getEventTypeLabel(event.event_type)}
                </span>
                <span className="event-attendees">
                  {event.attendee_count} attending
                </span>
              </div>

              <h3 className="event-card__title">{event.title}</h3>

              {event.business && (
                <div className="event-card__business">
                  by {event.business.name}
                </div>
              )}

              <div className="event-card__time">
                {formatDate(event.start_time, {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>

              {event.location && (
                <div className="event-card__location">
                  📍 {event.location}
                </div>
              )}

              {event.virtual_link && (
                <div className="event-card__virtual">
                  💻 Virtual Event Available
                </div>
              )}

              {event.description && (
                <p className="event-card__description">
                  {event.description.length > 100
                    ? `${event.description.substring(0, 100)}...`
                    : event.description
                  }
                </p>
              )}

              <div className="event-card__actions">
                <Button
                  variant="primary"
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.location.href = `/events/${event.id}`;
                  }}
                >
                  View Details
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Events;
