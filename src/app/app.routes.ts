
// src/app/app.routes.ts

import { AuthComponent } from './core/auth/auth.component';
import { StartPageComponent } from '../timesheet/start-page/start-page.component';
import { CalendarPageComponent } from '../timesheet/calendar-page/calendar-page.component';
import { ReviewPageComponent } from '../timesheet/review-page/review-page.component';
import { TimesheetComponent } from '../timesheet/timesheet.component';
import { AuthService } from '../app/core/services/auth.service';
import { Routes, CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { map } from 'rxjs';
import { Router } from '@angular/router';


const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  return inject(AuthService).getCurrentUser().pipe(
    map(isAuthenticated => isAuthenticated || router.createUrlTree(['/auth']))
  );
};

export const routes: Routes = [
  { path: 'auth', component: AuthComponent },
  {
    path: '',
    component: StartPageComponent,
    canActivate: [authGuard]
  },
  {
    path: 'calendar',
    component: CalendarPageComponent,
    canActivate: [authGuard]
  },
  {
    path: 'review',
    component: ReviewPageComponent,
    canActivate: [authGuard]
  },
  {
    path: 'timesheet',
    component: TimesheetComponent,
    canActivate: [authGuard]
  },
  { path: '**', redirectTo: 'auth' }
];