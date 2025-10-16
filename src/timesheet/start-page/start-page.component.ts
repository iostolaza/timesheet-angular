// src/app/components/start-page/start-page.component.ts
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '@aws-amplify/auth-angular';

@Component({
  selector: 'app-start-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './start-page.component.html',
  styleUrls: ['./start-page.component.css']
})
export class StartPageComponent {
  constructor(private authService: AuthService) {}

  logout() {
    this.authService.signOut();
  }
}
