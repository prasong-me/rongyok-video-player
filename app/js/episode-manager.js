class EpisodeManager {
  constructor(items = []) { this.setItems(items); }
  setItems(items) {
    this.items = Array.isArray(items) ? items.slice() : [];
    this.indexById = new Map(this.items.map((item, index) => [String(item.id), index]));
    return this.items;
  }
  currentIndex(id) { return this.indexById.has(String(id)) ? this.indexById.get(String(id)) : -1; }
  next(id) {
    const index = this.currentIndex(id);
    return index >= 0 && index + 1 < this.items.length ? this.items[index + 1] : null;
  }
  previous(id) {
    const index = this.currentIndex(id);
    return index > 0 ? this.items[index - 1] : null;
  }
}
window.EpisodeManager = EpisodeManager;
