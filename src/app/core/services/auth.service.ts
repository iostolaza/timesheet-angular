// src/app/core/services/auth.service.ts
import { Injectable } from '@angular/core';
import { Amplify, Auth } from 'aws-amplify';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  static async isAuthenticated(): Promise<boolean> {
    try {
      await Auth.currentAuthenticatedUser();
      return true;
    } catch {
      return false;
    }
  }

  async getCurrentUser() {
    try {
      const user = await Auth.currentAuthenticatedUser();
      return {
        username: user.username,
        isManager: user.signInUserSession?.accessToken?.payload['cognito:groups']?.includes('Managers') || false
      };
    } catch {
      return null;
    }
  }

  async signOut() {
    await Auth.signOut();
  }
}