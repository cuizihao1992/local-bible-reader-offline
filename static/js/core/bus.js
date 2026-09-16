Bible.bus = {
  _h: Object.create(null),
  on(type, fn) {
    if (!type || typeof fn !== "function") return function () {};
    (this._h[type] || (this._h[type] = [])).push(fn);
    return () => this.off(type, fn);
  },
  off(type, fn) {
    const list = this._h[type];
    if (!list) return;
    this._h[type] = list.filter((item) => item !== fn);
  },
  emit(type, payload) {
    const list = this._h[type];
    if (!list || !list.length) return;
    for (const fn of list.slice()) fn(payload);
  },
};
