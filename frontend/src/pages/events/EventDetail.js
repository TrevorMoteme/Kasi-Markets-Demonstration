import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';
import { useAuth } from '../../contexts/AuthContext';
import { eventsService } from '../../services/events';
import { formatDate, formatRelativeTime } from '../../utils/helpers';
import { EVENT_TYPES } from '../../utils/constants';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Map from '../../components/ui/Map';
import Modal from '../../components/common/Modal';
import './EventDetail.css';

const EventDetail = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useApp();
  const { user, isAuthenticated } = useAuth();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    loadEvent();
  }, [eventId]);

  const loadEvent = async () => {
    try {
      const eventData = await eventsService.getEvent(eventId);
      setEvent(eventData);
    } catch (error) {
      showToast(error.message, 'error');
      navigate('/events');
    } finally {
      setLoading(false);
    }
  };

  const handleRsvp = async () => {
    if (!isAuthenticated) {
      showToast('Please log in to RSVP to events', 'warning');
      return;
    }

    setRsvpLoading(true);
    try {
      await eventsService.rsvpToEvent(eventId);
      setEvent(prev => ({
        ...prev,
        user_attending: true,
        attendee_count: prev.attendee_count + 1
      }));
      showToast('RSVP successful!', 'success');
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setRsvpLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await eventsService.deleteEvent(eventId);
      showToast('Event deleted successfully', 'success');
      navigate(`/business/${event.business_id}/events`);
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setShowDeleteModal(false);
    }
  };

  const isEventOwner = user && event && user.id === event.business?.owner_id;
  const isPastEvent = event && new Date(event.start_time) < new Date();

  if (loading) {
    return (
      <div className="event-detail">
        <Card>
          <div className="event-detail__loading">Loading event...</div>
        </Card>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="event-detail">
        <Card>
          <div className="event-detail__error">
            <h2>Event Not Found</h2>
            <p>The event you're looking for doesn't exist.</p>
            <Button onClick={() => navigate('/events')}>
              Back to Events
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="event-detail">
      <div className="event-detail__header">
        <Button
          variant="text"
          onClick={() => navigate(-1)}
          className="event-detail__back"
        >
          ← Back
        </Button>

        {isEventOwner && (
          <div className="event-detail__actions">
            <Button
              variant="outline"
              onClick={() => navigate(`/events/${eventId}/edit`)}
            >
              Edit
            </Button>
            <Button
              variant="danger"
              onClick={() => setShowDeleteModal(true)}
            >
              Delete
            </Button>
          </div>
        )}
      </div>

      <Card className="event-detail__card">
        <div className="event-detail__content">
          <div className="event-detail__main">
            <div className="event-detail__meta">
              <span className={`event-type event-type--${event.event_type}`}>
                {EVENT_TYPES[event.event_type.toUpperCase()] || event.event_type}
              </span>
              <span className="event-attendees">
                {event.attendee_count} attending
              </span>
            </div>

            <h1 className="event-detail__title">{event.title}</h1>

            {event.business && (
              <div className="event-detail__business">
                Hosted by {event.business.name}
              </div>
            )}

            <div className="event-detail__time">
              <div className="event-time">
                <strong>Starts:</strong> {formatDate(event.start_time)}
              </div>
              {event.end_time && (
                <div className="event-time">
                  <strong>Ends:</strong> {formatDate(event.end_time)}
                </div>
              )}
            </div>

            {event.location && (
              <div className="event-detail__location">
                <h3>Location</h3>
                <p>{event.location}</p>
                {event.latitude && event.longitude && (
                  <Map
                    latitude={event.latitude}
                    longitude={event.longitude}
                    height="200px"
                  />
                )}
              </div>
            )}

            {event.virtual_link && (
              <div className="event-detail__virtual">
                <h3>Virtual Event</h3>
                <a
                  href={event.virtual_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="virtual-link"
                >
                  Join Virtual Event
                </a>
              </div>
            )}

            {event.description && (
              <div className="event-detail__description">
                <h3>Description</h3>
                <p>{event.description}</p>
              </div>
            )}

            {event.max_attendees && (
              <div className="event-detail__capacity">
                <strong>Capacity:</strong> {event.max_attendees} attendees
              </div>
            )}
          </div>

          <div className="event-detail__sidebar">
            {!isPastEvent && (
              <Card variant="outline" className="rsvp-card">
                <h3>Attend this Event</h3>
                <p>Let the host know you're coming!</p>
                <Button
                  onClick={handleRsvp}
                  loading={rsvpLoading}
                  disabled={event.user_attending || isPastEvent}
                  className="rsvp-button"
                >
                  {event.user_attending ? 'Already RSVPed' : 'RSVP Now'}
                </Button>
                {event.user_attending && (
                  <p className="rsvp-confirmed">You're attending this event!</p>
                )}
              </Card>
            )}

            {isPastEvent && (
              <Card variant="outline" className="past-event-card">
                <h3>Past Event</h3>
                <p>This event has already occurred.</p>
              </Card>
            )}
          </div>
        </div>
      </Card>

      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Event"
        actions={[
          {
            label: 'Cancel',
            variant: 'outline',
            onClick: () => setShowDeleteModal(false)
          },
          {
            label: 'Delete',
            variant: 'danger',
            onClick: handleDelete
          }
        ]}
      >
        <p>Are you sure you want to delete this event? This action cannot be undone.</p>
      </Modal>
    </div>
  );
};

export default EventDetail;


