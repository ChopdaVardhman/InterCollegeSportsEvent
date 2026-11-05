import { Routes } from '@angular/router';
import { Admin } from './admin/admin';
import { SportsRegistration } from './sports-registration/sports-registration';
import { ListOfParticipentDetailes } from './list-of-participent-detailes/list-of-participent-detailes';
import { authGuard, drsAuthGuard } from '../app/guards/auth-guard';
import { DrsStudentList } from './drs-student-list/drs-student-list';
import { AddSportComponent } from './add-sport/add-sport';

export const routes: Routes = [
  {
    path: '',
    component: Admin
  },
  {
    path: 'registration', // <-- '/' hata diya hai
    component: SportsRegistration,
    canActivate: [authGuard]
  },
  {
    path: 'registrationList', // <-- '/' hata diya hai
    component: ListOfParticipentDetailes,
    canActivate: [authGuard]
  },
   {
    path: 'drs/registrationList', 
    component: DrsStudentList,
    canActivate:[drsAuthGuard]
  },

  {
    path:"add-sport",
    component:AddSportComponent,
    canActivate:[drsAuthGuard]
  },
  
  {
    path: '**',
    redirectTo: '' 
  },

  

];