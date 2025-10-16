// src/app/timesheet/start-page/start-page.component.ts
import { Component, Inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../app/core/services/auth.service';

@Component({
  selector: 'app-start-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './start-page.component.html'
})
export class StartPageComponent {
  constructor(@Inject(AuthService) private authService: AuthService) {}

  async logout() {
    await this.authService.signOut();
  }
}