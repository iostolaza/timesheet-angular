// src/app/timesheet/auth/auth.component.ts
import { Component } from '@angular/core';
import { AmplifyAuthenticator, AmplifySignIn, AmplifySignUp, AmplifySignOut } from '@aws-amplify/ui-angular';
import { Router } from '@angular/router';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [AmplifyAuthenticator, AmplifySignIn, AmplifySignUp, AmplifySignOut],
  templateUrl: './auth.component.html'
})
export class AuthComponent {
  constructor(private router: Router) {}

  onLogin() {
    this.router.navigate(['/']);
  }
}
