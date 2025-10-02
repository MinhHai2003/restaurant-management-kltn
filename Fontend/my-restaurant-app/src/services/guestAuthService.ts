class GuestAuthService {
  private guestCredentials = {
    email: 'nguoidung@gmail.com',
    password: '602057Aa'
  };

  async getGuestToken(): Promise<string | null> {
    try {
      const response = await fetch('http://localhost:5001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(this.guestCredentials)
      });

      if (response.ok) {
        const data = await response.json();
        return data.token;
      }
      
      console.error('Failed to authenticate guest account');
      return null;
    } catch (error) {
      console.error('Guest authentication error:', error);
      return null;
    }
  }

  async ensureGuestAuthentication(): Promise<string | null> {
    // Check if user is already logged in
    const existingToken = localStorage.getItem('customerToken');
    if (existingToken) {
      return existingToken;
    }

    // If not logged in, use guest account
    const guestToken = await this.getGuestToken();
    if (guestToken) {
      // Store guest token temporarily (don't persist like normal login)
      sessionStorage.setItem('guestToken', guestToken);
      return guestToken;
    }

    return null;
  }

  getStoredToken(): string | null {
    // Priority: customerToken (real user) > guestToken (guest user)
    return localStorage.getItem('customerToken') || sessionStorage.getItem('guestToken');
  }

  clearGuestToken(): void {
    sessionStorage.removeItem('guestToken');
  }
}

export const guestAuthService = new GuestAuthService();