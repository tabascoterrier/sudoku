import { matchRoute, type Route } from './routes';

class Router {
  route = $state<Route>(matchRoute(window.location.pathname));

  constructor() {
    window.addEventListener('popstate', () => {
      this.route = matchRoute(window.location.pathname);
    });
  }

  navigate(path: string): void {
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
    }
    this.route = matchRoute(path);
  }
}

export const router = new Router();
