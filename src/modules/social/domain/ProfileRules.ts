export class ProfileRules {
  public static isProfileComplete(user: {
    username?: string | null;
    name?: string | null;
    bio?: string | null;
  } | null): boolean {
    if (!user) return false;
    const { username, name, bio } = user;

    const hasValidName = Boolean(name && name.trim() !== '');
    const hasValidHandle = Boolean(
      username &&
      username.trim() !== '' &&
      !username.startsWith('user_') &&
      !username.includes('@')
    );
    const hasBio = Boolean(bio && bio.trim() !== '');

    return Boolean(hasValidName && hasValidHandle && hasBio);
  }
}
