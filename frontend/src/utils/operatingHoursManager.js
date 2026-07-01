// utils/operatingHoursManager.js
// Permanent solution for managing business operating hours in localStorage

const STORAGE_PREFIX = 'kasi_business_hours';
const SPECIAL_HOURS_PREFIX = 'kasi_special_hours';

// Default operating hours (can be customized per business)
const DEFAULT_OPERATING_HOURS = {
  monday: { enabled: true, open: '09:00', close: '18:00' },
  tuesday: { enabled: true, open: '09:00', close: '18:00' },
  wednesday: { enabled: true, open: '09:00', close: '18:00' },
  thursday: { enabled: true, open: '09:00', close: '18:00' },
  friday: { enabled: true, open: '09:00', close: '18:00' },
  saturday: { enabled: true, open: '10:00', close: '16:00' },
  sunday: { enabled: false, open: '09:00', close: '17:00' }
};

class OperatingHoursManager {
  constructor(businessId) {
    this.businessId = businessId;
    this.listeners = [];
    this.statusTimer = null;
  }

  // Get storage keys
  getHoursKey() {
    return `${STORAGE_PREFIX}_${this.businessId}`;
  }

  getSpecialHoursKey() {
    return `${SPECIAL_HOURS_PREFIX}_${this.businessId}`;
  }

  // Save operating hours to localStorage
  saveOperatingHours(hours) {
    try {
      const data = {
        businessId: this.businessId,
        hours,
        updatedAt: new Date().toISOString(),
        version: '1.0'
      };
      localStorage.setItem(this.getHoursKey(), JSON.stringify(data));
      console.log('💾 Operating hours saved:', hours);

      // Notify all listeners
      this.notifyListeners('operatingHours', hours);

      return true;
    } catch (error) {
      console.error('Failed to save operating hours:', error);
      return false;
    }
  }

  // Load operating hours from localStorage
  loadOperatingHours() {
    try {
      const stored = localStorage.getItem(this.getHoursKey());
      if (stored) {
        const parsed = JSON.parse(stored);
        console.log('📂 Operating hours loaded:', parsed.hours);
        return parsed.hours;
      }
    } catch (error) {
      console.error('Failed to load operating hours:', error);
    }
    return null;
  }

  // Get operating hours with fallback to defaults
  getOperatingHours() {
    const saved = this.loadOperatingHours();
    return saved || DEFAULT_OPERATING_HOURS;
  }

  // Save special hours to localStorage
  saveSpecialHours(hours) {
    try {
      const data = {
        businessId: this.businessId,
        hours,
        updatedAt: new Date().toISOString(),
        version: '1.0'
      };
      localStorage.setItem(this.getSpecialHoursKey(), JSON.stringify(data));
      console.log('💾 Special hours saved:', hours);

      // Notify all listeners
      this.notifyListeners('specialHours', hours);

      return true;
    } catch (error) {
      console.error('Failed to save special hours:', error);
      return false;
    }
  }

  // Load special hours from localStorage
  loadSpecialHours() {
    try {
      const stored = localStorage.getItem(this.getSpecialHoursKey());
      if (stored) {
        const parsed = JSON.parse(stored);
        console.log('📂 Special hours loaded:', parsed.hours);
        return parsed.hours;
      }
    } catch (error) {
      console.error('Failed to load special hours:', error);
    }
    return [];
  }

  // Get special hours
  getSpecialHours() {
    const saved = this.loadSpecialHours();
    return saved || [];
  }

  // Update a single day's hours
  updateDay(day, hours) {
    const current = this.getOperatingHours();
    const updated = {
      ...current,
      [day]: {
        ...current[day],
        ...hours
      }
    };
    this.saveOperatingHours(updated);
    return updated;
  }

  // Toggle a day's open/closed status
  toggleDay(day) {
    const current = this.getOperatingHours();
    const updated = {
      ...current,
      [day]: {
        ...current[day],
        enabled: !current[day]?.enabled
      }
    };
    this.saveOperatingHours(updated);
    return updated;
  }

  // Copy hours from one day to another
  copyHours(fromDay, toDay) {
    const current = this.getOperatingHours();
    if (!current[fromDay]) return current;

    const updated = {
      ...current,
      [toDay]: {
        ...current[toDay],
        open: current[fromDay].open,
        close: current[fromDay].close
      }
    };
    this.saveOperatingHours(updated);
    return updated;
  }

  // Copy hours to all weekdays
  copyToWeekdays(sourceDay = 'monday') {
    const current = this.getOperatingHours();
    const weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
    const updated = { ...current };

    weekdays.forEach(day => {
      if (day !== sourceDay) {
        updated[day] = {
          ...updated[day],
          open: current[sourceDay].open,
          close: current[sourceDay].close
        };
      }
    });

    this.saveOperatingHours(updated);
    return updated;
  }

  // Copy hours to all days
  copyToAllDays(sourceDay = 'monday') {
    const current = this.getOperatingHours();
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const updated = { ...current };

    days.forEach(day => {
      if (day !== sourceDay) {
        updated[day] = {
          ...updated[day],
          open: current[sourceDay].open,
          close: current[sourceDay].close
        };
      }
    });

    this.saveOperatingHours(updated);
    return updated;
  }

  // Add special hours
  addSpecialHours(specialHour) {
    const current = this.getSpecialHours();
    const newSpecial = {
      ...specialHour,
      id: Date.now().toString()
    };
    const updated = [...current, newSpecial];
    this.saveSpecialHours(updated);
    return updated;
  }

  // Update special hours
  updateSpecialHours(id, specialHour) {
    const current = this.getSpecialHours();
    const updated = current.map(sh =>
      sh.id === id ? { ...specialHour, id } : sh
    );
    this.saveSpecialHours(updated);
    return updated;
  }

  // Remove special hours
  removeSpecialHours(id) {
    const current = this.getSpecialHours();
    const updated = current.filter(sh => sh.id !== id);
    this.saveSpecialHours(updated);
    return updated;
  }

  // Check if business is currently open
  isCurrentlyOpen() {
    const hours = this.getOperatingHours();
    const specialHours = this.getSpecialHours();

    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const dayMap = {
      1: 'monday', 2: 'tuesday', 3: 'wednesday', 4: 'thursday',
      5: 'friday', 6: 'saturday', 0: 'sunday'
    };
    const todayKey = dayMap[currentDay];

    // Check special hours first
    const todayStr = now.toISOString().split('T')[0];
    const specialToday = specialHours.find(sh => sh.date === todayStr);

    if (specialToday) {
      if (specialToday.closed) return false;
      if (specialToday.open && specialToday.close) {
        const [openHour, openMin] = specialToday.open.split(':').map(Number);
        const [closeHour, closeMin] = specialToday.close.split(':').map(Number);
        const openTime = openHour * 60 + openMin;
        const closeTime = closeHour * 60 + closeMin;
        return currentTime >= openTime && currentTime <= closeTime;
      }
    }

    // Check regular hours
    const todayHours = hours[todayKey];
    if (!todayHours || !todayHours.enabled) return false;

    const [openHour, openMin] = (todayHours.open || '09:00').split(':').map(Number);
    const [closeHour, closeMin] = (todayHours.close || '17:00').split(':').map(Number);
    const openTime = openHour * 60 + openMin;
    const closeTime = closeHour * 60 + closeMin;

    return currentTime >= openTime && currentTime <= closeTime;
  }

  // Get today's hours
  getTodayHours() {
    const hours = this.getOperatingHours();
    const now = new Date();
    const dayMap = {
      1: 'monday', 2: 'tuesday', 3: 'wednesday', 4: 'thursday',
      5: 'friday', 6: 'saturday', 0: 'sunday'
    };
    const todayKey = dayMap[now.getDay()];
    return hours[todayKey] || null;
  }

  // Format time for display
  formatTime(time24) {
    if (!time24) return '';
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  }

  // Get formatted hours for display
  getFormattedHours() {
    const hours = this.getOperatingHours();
    const days = [
      { key: 'monday', label: 'Monday' },
      { key: 'tuesday', label: 'Tuesday' },
      { key: 'wednesday', label: 'Wednesday' },
      { key: 'thursday', label: 'Thursday' },
      { key: 'friday', label: 'Friday' },
      { key: 'saturday', label: 'Saturday' },
      { key: 'sunday', label: 'Sunday' }
    ];

    return days.map(day => ({
      ...day,
      data: hours[day.key],
      displayTime: hours[day.key]?.enabled
        ? `${this.formatTime(hours[day.key].open)} - ${this.formatTime(hours[day.key].close)}`
        : 'Closed'
    }));
  }

  // Subscribe to changes
  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  // Notify all listeners of changes
  notifyListeners(type, data) {
    this.listeners.forEach(callback => {
      callback({ type, data, businessId: this.businessId });
    });
  }

  // Start real-time status updates (checks every minute)
  startRealTimeUpdates(callback) {
    if (this.statusTimer) clearInterval(this.statusTimer);

    // Initial update
    callback({
      isOpen: this.isCurrentlyOpen(),
      todayHours: this.getTodayHours(),
      formattedTime: this.getTodayHours()?.enabled
        ? `${this.formatTime(this.getTodayHours().open)} - ${this.formatTime(this.getTodayHours().close)}`
        : null
    });

    // Update every minute
    this.statusTimer = setInterval(() => {
      callback({
        isOpen: this.isCurrentlyOpen(),
        todayHours: this.getTodayHours(),
        formattedTime: this.getTodayHours()?.enabled
          ? `${this.formatTime(this.getTodayHours().open)} - ${this.formatTime(this.getTodayHours().close)}`
          : null
      });
    }, 60000);

    return () => {
      if (this.statusTimer) clearInterval(this.statusTimer);
    };
  }

  // Clear all data for this business
  clearAllData() {
    localStorage.removeItem(this.getHoursKey());
    localStorage.removeItem(this.getSpecialHoursKey());
    console.log('🗑️ All hours data cleared for business:', this.businessId);
  }

  // Export data for backup
  exportData() {
    return {
      businessId: this.businessId,
      operatingHours: this.getOperatingHours(),
      specialHours: this.getSpecialHours(),
      exportedAt: new Date().toISOString()
    };
  }

  // Import data from backup
  importData(data) {
    if (data.operatingHours) {
      this.saveOperatingHours(data.operatingHours);
    }
    if (data.specialHours) {
      this.saveSpecialHours(data.specialHours);
    }
    return true;
  }
}

// Singleton instances per business ID
const instances = new Map();

export function getOperatingHoursManager(businessId) {
  if (!instances.has(businessId)) {
    instances.set(businessId, new OperatingHoursManager(businessId));
  }
  return instances.get(businessId);
}

export default OperatingHoursManager;