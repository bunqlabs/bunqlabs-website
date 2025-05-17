class Router extends EventTarget {
  constructor() {
    super();
    window.addEventListener('popstate', () => this._dispatch());
  }

  _dispatch() {
    const page = location.pathname.replace(/^\//, '') || 'home';
    this.dispatchEvent(new CustomEvent('navigate', { detail: { page } }));
  }

  navigate(page) {
    if (location.pathname !== `/${page}`) {
      history.pushState({}, '', `/${page}`);
      this._dispatch();
    }
  }

  refresh() { this._dispatch(); }
}
export default new Router();
