// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { AuthComponent } from '../app/timesheet/auth/auth.component';
import { StartPageComponent } from '../timesheet/start-page/start-page.component';
import { CalendarPageComponent } from '../timesheet/calendar-page/calendar-page.component';
import { ReviewPageComponent } from '../timesheet/review-page/review-page.component';
import { TimesheetComponent } from '../timesheet/timesheet.component';
import { AuthService } from '../app/core/services/auth.service';

export const routes: Routes = [
  { path: 'auth', component: AuthComponent },
  {
    path: '',
    component: StartPageComponent,
    canActivate: [() => AuthService.isAuthenticated()]
  },
  {
    path: 'calendar',
    component: CalendarPageComponent,
    canActivate: [() => AuthService.isAuthenticated()]
  },
  {
    path: 'review',
    component: ReviewPageComponent,
    canActivate: [() => AuthService.isAuthenticated()]
  },
  {
    path: 'timesheet',
    component: TimesheetComponent,
    canActivate: [() => AuthService.isAuthenticated()]
  },
  { path: '**', redirectTo: 'auth' }
];
