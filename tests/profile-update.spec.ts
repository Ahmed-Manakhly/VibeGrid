import { UpdateProfileUseCase } from '../src/modules/social/application/UpdateProfile.usecase';

describe('UpdateProfileUseCase & Profile Security Rules', () => {
  it('should reject unauthorized profile update attempts with empty userId', async () => {
    const mockRepo = {
      getProfileByUsername: jest.fn(),
      updateProfile: jest.fn(),
    };

    const useCase = new UpdateProfileUseCase(mockRepo);
    await expect(useCase.execute('', { name: 'New Name' })).rejects.toThrow('Unauthorized');
  });

  it('should update profile data when authorized', async () => {
    const mockRepo = {
      getProfileByUsername: jest.fn(),
      updateProfile: jest.fn().mockResolvedValue({ id: 'usr_1', name: 'New Name', username: 'new_name' }),
    };

    const useCase = new UpdateProfileUseCase(mockRepo);
    const res = await useCase.execute('usr_1', { name: 'New Name', username: 'new_name' });

    expect(res.success).toBe(true);
    expect(res.user.name).toBe('New Name');
    expect(mockRepo.updateProfile).toHaveBeenCalledWith('usr_1', { name: 'New Name', username: 'new_name' });
  });
});
