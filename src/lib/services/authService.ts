export const authService = {
  async login(password: string): Promise<boolean> {
    return false; // Fail initially
  },
  async isAuthenticated(): Promise<boolean> {
    return false;
  },
  async logout(): Promise<void> {
    // TBD
  }
};
