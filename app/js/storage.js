const Storage = {
  KEYS: {
    HISTORY: 'rongyok_history_v5',
    BOOKMARKS: 'rongyok_bookmarks_v5',
    PROGRESS: 'rongyok_progress_v5'
  },
  MAX_HISTORY: 100,
  MAX_AGE: 30 * 24 * 60 * 60 * 1000,

  _read(key, fallback = []) {
    try {
      const raw = localStorage.getItem(key);
      const data = raw ? JSON.parse(raw) : fallback;
      return Array.isArray(data) ? data.filter(x => !x.timestamp || Date.now() - x.timestamp <= this.MAX_AGE) : fallback;
    } catch { return fallback; }
  },
  _write(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch { return false; }
  },

  addHistory(video) {
    const list = this._read(this.KEYS.HISTORY).filter(x => String(x.id) !== String(video.id));
    list.unshift({ ...video, timestamp: Date.now() });
    this._write(this.KEYS.HISTORY, list.slice(0, this.MAX_HISTORY));
  },
  getHistory() { return this._read(this.KEYS.HISTORY); },
  clearHistory() { localStorage.removeItem(this.KEYS.HISTORY); },

  addBookmark(video) {
    const list = this._read(this.KEYS.BOOKMARKS);
    if (!list.some(x => String(x.id) === String(video.id))) {
      list.unshift({ ...video, timestamp: Date.now() });
      this._write(this.KEYS.BOOKMARKS, list);
    }
  },
  removeBookmark(id) {
    this._write(this.KEYS.BOOKMARKS, this._read(this.KEYS.BOOKMARKS).filter(x => String(x.id) !== String(id)));
  },
  isBookmarked(id) { return this._read(this.KEYS.BOOKMARKS).some(x => String(x.id) === String(id)); },
  getBookmarks() { return this._read(this.KEYS.BOOKMARKS); },
  clearBookmarks() { localStorage.removeItem(this.KEYS.BOOKMARKS); },

  saveProgress(id, time, duration, completed = false) {
    if (!id || !Number.isFinite(time) || !Number.isFinite(duration) || duration <= 0) return;
    const list = this._read(this.KEYS.PROGRESS).filter(x => String(x.id) !== String(id));
    if (!completed && duration - time > 10 && time >= 5) {
      list.push({ id, time, duration, timestamp: Date.now(), completed: false });
    } else if (completed) {
      list.push({ id, time: 0, duration, timestamp: Date.now(), completed: true });
    }
    this._write(this.KEYS.PROGRESS, list);
  },
  getProgress(id) { return this._read(this.KEYS.PROGRESS).find(x => String(x.id) === String(id)) || null; },
  clearProgress() { localStorage.removeItem(this.KEYS.PROGRESS); }
};
