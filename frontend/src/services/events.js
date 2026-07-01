import { apiService } from './api';

export const eventsService = {
  async createEvent(businessId, eventData) {
    try {
      const response = await apiService.post(`/businesses/${businessId}/events`, eventData);
      return response;
    } catch (error) {
      throw error;
    }
  },

  async getUpcomingEvents(limit = 20, offset = 0) {
    try {
      const response = await apiService.get(`/events/upcoming?limit=${limit}&offset=${offset}`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  async getEvent(eventId) {
    try {
      const response = await apiService.get(`/events/${eventId}`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  async rsvpToEvent(eventId) {
    try {
      const response = await apiService.post(`/events/${eventId}/rsvp`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  async getBusinessEvents(businessId) {
    try {
      const response = await apiService.get(`/businesses/${businessId}/events`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  async updateEvent(eventId, eventData) {
    try {
      const response = await apiService.put(`/events/${eventId}`, eventData);
      return response;
    } catch (error) {
      throw error;
    }
  },

  async deleteEvent(eventId) {
    try {
      const response = await apiService.delete(`/events/${eventId}`);
      return response;
    } catch (error) {
      throw error;
    }
  },
};