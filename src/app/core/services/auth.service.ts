// src/app/core/services/auth.service.ts
import { Injectable } from '@angular/core';
import Auth from '@aws-amplify/auth';

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

  async getCurrentUser(): Promise<{ username: string; isManager: boolean } | null> {
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

  async signOut(): Promise<void> {
    try {
      await Auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  }
}