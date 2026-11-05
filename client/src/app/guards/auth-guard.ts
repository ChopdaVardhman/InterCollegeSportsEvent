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



/* =========================================================
   2. DSW Portal Guard 
   ========================================================= */
export const drsAuthGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);

  const userRole = localStorage.getItem('user_role');
  const rawDrsData = localStorage.getItem('drs_data');

  // Check karo ki user role drs hai aur drs_data exist karta hai
  if (userRole === 'drs' && rawDrsData) {
    try {
      const drsUser = JSON.parse(rawDrsData);
      if (drsUser && (drsUser.user_id || drsUser.user_name)) {
        return true; // Valid DRS session, access allowed
      }
    } catch (e) {
      console.error('Invalid DRS session data in localStorage', e);
    }
  }

  router.navigate(['/']);
  return false;
};