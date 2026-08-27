/**
 * SafeRide AI - Authority & Route Access Control Guard
 * Defines which roles can access which pages/features.
 */

const AuthorityModule = (function () {
  // Define authorized pages for each user role
  const ROLE_PERMISSIONS = {
    // Guests can only view index.html (login/guest landing) and user.html (limited view)
    guest: {
      allowedPages: ['index.html', 'user.html'],
      defaultPage: 'user.html'
    },
    // Students can view index.html and user.html
    student: {
      allowedPages: ['index.html', 'user.html'],
      defaultPage: 'user.html'
    },
    // Admins (Security Staff) can view index.html and admin.html
    admin: {
      allowedPages: ['index.html', 'admin.html'],
      defaultPage: 'admin.html'
    }
  };

  /**
   * Determine if the user is authorized to access a given page/path
   * @param {Object} user - The current user object from AuthModule
   * @param {string} path - The current window pathname
   * @returns {Object} { authorized: boolean, redirect: string|null }
   */
  function authorize(user, path) {
    const filename = path.split('/').pop() || 'index.html';
    
    // 1. If not logged in (user is null)
    if (!user) {
      // Unauthenticated users can only be on index.html
      if (filename !== 'index.html') {
        return { authorized: false, redirect: 'index.html' };
      }
      return { authorized: true, redirect: null };
    }

    // 2. If logged in, get the role-specific permissions
    const userRole = user.role || 'guest';
    const permissions = ROLE_PERMISSIONS[userRole];

    if (!permissions) {
      // Invalid role: force logout and redirect to index.html
      return { authorized: false, redirect: 'index.html' };
    }

    // 3. Prevent logged-in users from staying on the login page (index.html)
    if (filename === 'index.html') {
      return { authorized: false, redirect: permissions.defaultPage };
    }

    // 4. Check if the page is explicitly allowed for this role
    const isAllowed = permissions.allowedPages.includes(filename);
    if (!isAllowed) {
      return { authorized: false, redirect: permissions.defaultPage };
    }

    return { authorized: true, redirect: null };
  }

  /**
   * Guard the current route based on active user state.
   * Performs redirect if unauthorized.
   * @param {Object} user - The current user object
   * @returns {boolean} True if authorized, False if redirecting
   */
  function guardRoute(user) {
    const currentPath = window.location.pathname.toLowerCase();
    const result = authorize(user, currentPath);
    
    if (!result.authorized && result.redirect) {
      console.log(`[SafeRide Authority] Access Denied to ${currentPath}. Redirecting to ${result.redirect}...`);
      window.location.href = result.redirect;
      return false;
    }
    
    console.log(`[SafeRide Authority] Access Granted to ${currentPath} for role: ${user ? user.role : 'anonymous'}`);
    return true;
  }

  return {
    ROLE_PERMISSIONS,
    authorize,
    guardRoute
  };
})();
