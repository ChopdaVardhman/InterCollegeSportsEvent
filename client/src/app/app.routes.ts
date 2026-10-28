import { Routes } from '@angular/router';
import { Admin } from './admin/admin';
import { DeanFormComponent } from './dean-registration/dean-registration';

export const routes: Routes = [
  {
    path: '',
    component: Admin
  },
  {
    path: 'registration', // <-- '/' hata diya hai
    component: DeanFormComponent
  },
  {
    path: '**',
    redirectTo: '' // <-- Kisi bhi invalid route par home page par bhej dega
  }
];