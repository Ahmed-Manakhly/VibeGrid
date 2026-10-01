export class ProfileRules {
  public static isProfileComplete(user: { username?: string | null; name?: string | null } | null): boolean {
    if (!user) return false;
    const { username, name } = user;
    return Boolean(
      username &&
      username.trim() !== '' &&
      !username.startsWith('user_') &&
      name &&
      name.trim() !== ''
    );
  }
}
