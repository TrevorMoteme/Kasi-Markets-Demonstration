import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';
import { useBusiness } from '../../contexts/BusinessContext';
import { eventsService } from '../../services/events';
import { EVENT_TYPES } from '../../utils/constants';
import { eventValidation } from '../../utils/validation';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/common/Modal';
import './CreateEvent.css';

const CreateEvent = () => {
  const { businessId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useApp();
  const { currentBusiness } = useBusiness();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_type: 'workshop',
    start_time: '',
    end_time: '',
    location: '',
    virtual_link: '',
    max_attendees: ''
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    Object.keys(eventValidation).forEach(field => {
      const validation = eventValidation[field];
      const value = formData[field];

      if (validation.required && !value) {
        newErrors[field] = validation.message;
      } else if (value && validation.validate && !validation.validate(value)) {
        newErrors[field] = validation.message;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      showToast('Please fix the errors in the form', 'error');
      return;
    }

    setLoading(true);

    try {
      const eventData = {
        ...formData,
        start_time: new Date(formData.start_time).toISOString(),
        end_time: formData.end_time ? new Date(formData.end_time).toISOString() : null,
        max_attendees: formData.max_attendees ? parseInt(formData.max_attendees) : null
      };

      await eventsService.createEvent(businessId, eventData);
      showToast('Event created successfully!', 'success');
      navigate(`/business/${businessId}/events`);
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };

  if (!currentBusiness) {
    return (
      <div className="create-event">
        <Card>
          <div className="create-event__error">
            <h2>Business Not Found</h2>
            <p>Unable to create event for this business.</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="create-event">
      <Card className="create-event__card">
        <div className="create-event__header">
          <h1>Create New Event</h1>
          <p>Create an event for {currentBusiness.name}</p>
        </div>

        <form onSubmit={handleSubmit} className="create-event__form">
          <Input
            label="Event Title *"
            name="title"
            value={formData.title}
            onChange={handleChange}
            error={errors.title}
            required
            placeholder="Enter event title"
          />

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="event_type" className="input-label">
                Event Type *
              </label>
              <select
                id="event_type"
                name="event_type"
                value={formData.event_type}
                onChange={handleChange}
                className={`ui-input ${errors.event_type ? 'ui-input--error' : ''}`}
              >
                {Object.entries(EVENT_TYPES).map(([key, value]) => (
                  <option key={key} value={value}>
                    {key.charAt(0) + key.slice(1).toLowerCase().replace('_', ' ')}
                  </option>
                ))}
              </select>
              {errors.event_type && (
                <div className="ui-input-error">{errors.event_type}</div>
              )}
            </div>

            <Input
              label="Max Attendees"
              name="max_attendees"
              type="number"
              value={formData.max_attendees}
              onChange={handleChange}
              error={errors.max_attendees}
              placeholder="Optional"
              min="1"
            />
          </div>

          <Input
            label="Start Time *"
            name="start_time"
            type="datetime-local"
            value={formData.start_time}
            onChange={handleChange}
            error={errors.start_time}
            required
            min={getMinDateTime()}
          />

          <Input
            label="End Time"
            name="end_time"
            type="datetime-local"
            value={formData.end_time}
            onChange={handleChange}
            error={errors.end_time}
            min={formData.start_time || getMinDateTime()}
          />

          <Input
            label="Location"
            name="location"
            value={formData.location}
            onChange={handleChange}
            error={errors.location}
            placeholder="Physical event location"
          />

          <Input
            label="Virtual Link"
            name="virtual_link"
            value={formData.virtual_link}
            onChange={handleChange}
            error={errors.virtual_link}
            placeholder="Zoom, Google Meet, etc."
          />

          <div className="form-group">
            <label htmlFor="description" className="input-label">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className={`ui-input ${errors.description ? 'ui-input--error' : ''}`}
              placeholder="Describe your event..."
              rows="4"
            />
            {errors.description && (
              <div className="ui-input-error">{errors.description}</div>
            )}
          </div>

          <div className="create-event__actions">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={loading}
              disabled={loading}
            >
              Create Event
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default CreateEvent;
