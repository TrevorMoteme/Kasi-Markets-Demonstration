// src/services/offlineSync.js
class OfflineSyncService {
  constructor() {
    this.queue = [];
    this.isProcessing = false;

    // Load queue from localStorage
    this.loadQueue();

    // Listen for online events
    window.addEventListener('online', () => this.processQueue());
  }

  loadQueue() {
    try {
      const saved = localStorage.getItem('offline_likes_queue');
      if (saved) {
        this.queue = JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load offline queue:', e);
    }
  }

  saveQueue() {
    localStorage.setItem('offline_likes_queue', JSON.stringify(this.queue));
  }

  addToQueue(action) {
    this.queue.push({
      ...action,
      id: Date.now(),
      retryCount: 0
    });
    this.saveQueue();

    // Try to process if online
    if (navigator.onLine) {
      this.processQueue();
    }
  }

  async processQueue() {
    if (this.isProcessing || !navigator.onLine || this.queue.length === 0) return;

    this.isProcessing = true;
    const toProcess = [...this.queue];

    for (const item of toProcess) {
      try {
        // Process based on action type
        if (item.type === 'like') {
          await postsService.likePost(item.postId);
        } else if (item.type === 'unlike') {
          await postsService.unlikePost(item.postId);
        }

        // Remove from queue on success
        this.queue = this.queue.filter(q => q.id !== item.id);
        this.saveQueue();

      } catch (error) {
        console.error(`Failed to process offline action ${item.id}:`, error);
        item.retryCount++;

        if (item.retryCount >= 3) {
          // Remove after 3 failures
          this.queue = this.queue.filter(q => q.id !== item.id);
          this.saveQueue();
        }
      }
    }

    this.isProcessing = false;

    // If queue still has items, try again later
    if (this.queue.length > 0) {
      setTimeout(() => this.processQueue(), 30000);
    }
  }
}

export const offlineSync = new OfflineSyncService();