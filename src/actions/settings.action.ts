'use server';

import { getCurrentSession } from '@/lib/auth/server';
import { revalidatePath } from 'next/cache';
import { EnvConfigRepository } from '@/modules/config/infrastructure/EnvConfigRepository';

export async function changePasswordAction(formData: FormData) {
  const currentPassword = formData.get('currentPassword') as string;
  const newPassword = formData.get('newPassword') as string;

  if (!currentPassword || !newPassword) {
    return { success: false, error: 'Current password and new password are required' };
  }

  const session = await getCurrentSession();
  if (!session.isAuthenticated || !session.user) {
    return { success: false, error: 'Authentication required' };
  }

  // Next.js BFF proxies to Auth Microservice Change Password endpoint
  try {
    const { cookies } = await import('next/headers');
    const { COOKIE_CONFIG } = await import('@/lib/auth/cookie.config');
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_CONFIG.accessToken.name)?.value;

    const { apiBaseUrl } = EnvConfigRepository.getEndpoints();
    const res = await fetch(`${apiBaseUrl.replace(/\/$/, '')}/api/auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        currentPassword,
        newPassword,
        passwordConfirm: newPassword,
      }),
      cache: 'no-store',
    });

    const json = await res.json();
    if (!res.ok || json.status !== 'success') {
      return { success: false, error: json.message || 'Failed to change password' };
    }

    revalidatePath('/settings');
    
    // Clear client session cookies so Next.js middleware and browser immediately reflect logged-out status
    cookieStore.delete(COOKIE_CONFIG.accessToken.name);
    cookieStore.delete(COOKIE_CONFIG.refreshToken.name);

    return { success: true, message: 'Password changed successfully' };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error proxying password change' };
  }
}
