import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);

  const rawUserData = localStorage.getItem('userData');
  const collegeId = localStorage.getItem('college_id');

  if (rawUserData && collegeId) {
    try {
      const user = JSON.parse(rawUserData);
      if (user && user.Success === '1') {
        return true;
      }
    } catch (e) {
      console.error('Invalid session data in localStorage', e);
    }
  }

  // Login nahi hone par default admin/login component ('') par redirect
  router.navigate(['/']);
  return false;
};