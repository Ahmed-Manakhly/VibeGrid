import { authServiceFetch } from "@/lib/auth/auth.client";

export class ChangePasswordUseCase {
  async execute(currentPassword: string, newPassword: string, token: string) {
    if (!currentPassword || !newPassword) {
      return { success: false, error: "Current password and new password are required" };
    }

    const authRes = await authServiceFetch('/change-password', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        currentPassword,
        newPassword,
        passwordConfirm: newPassword,
      }),
    });

    const isSuccess = authRes.ok && (authRes.data?.status === 'success' || authRes.data?.success === true);

    if (!isSuccess) {
      const errorMessage = authRes.data?.error || authRes.data?.message || authRes.data?.data?.message || 'Failed to change password';
      return { success: false, error: errorMessage };
    }

    return { success: true, message: authRes.data?.data?.message || authRes.data?.message || 'Password changed successfully' };
  }
}
