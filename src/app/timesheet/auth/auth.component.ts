// src/app/timesheet/auth/auth.component.ts
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AmplifyAuthenticatorModule } from '@aws-amplify/ui-angular';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [AmplifyAuthenticatorModule],
  templateUrl: './auth.component.html',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AuthComponent {
  private router = inject(Router);
  isLoading = false;
  error: string | null = null;

  onLogin() {
    this.isLoading = true;
    this.error = null;
    try {
      this.router.navigate(['/']);
    } catch (error) {
      this.error = 'Failed to redirect after login';
      console.error(error);
    } finally {
      this.isLoading = false;
    }
  }
}