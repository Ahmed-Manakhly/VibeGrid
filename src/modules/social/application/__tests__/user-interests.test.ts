import { GetUserInterestsUseCase } from '../GetUserInterests.usecase';
import { SetUserInterestsUseCase } from '../SetUserInterests.usecase';
import { IUserInterestRepository } from '../../domain/IUserInterestRepository';
import { ITaxonomyRepository } from '@/modules/taxonomy/domain/ITaxonomyRepository';

describe('GetUserInterestsUseCase', () => {
  let mockInterestRepo: jest.Mocked<IUserInterestRepository>;
  let useCase: GetUserInterestsUseCase;

  beforeEach(() => {
    mockInterestRepo = {
      getUserInterests: jest.fn(),
      setUserInterests: jest.fn(),
    };
    useCase = new GetUserInterestsUseCase(mockInterestRepo);
  });

  it('throws error if userId is missing', async () => {
    await expect(useCase.execute('')).rejects.toThrow('User ID is required');
  });

  it('returns categories for valid userId', async () => {
    const mockCategories = [{ id: 'cat-1', name: 'Tech', slug: 'tech', emoji: '💻' }];
    mockInterestRepo.getUserInterests.mockResolvedValue(mockCategories);

    const result = await useCase.execute('user-123');
    expect(result).toEqual(mockCategories);
    expect(mockInterestRepo.getUserInterests).toHaveBeenCalledWith('user-123');
  });
});

describe('SetUserInterestsUseCase', () => {
  let mockInterestRepo: jest.Mocked<IUserInterestRepository>;
  let mockTaxonomyRepo: jest.Mocked<ITaxonomyRepository>;
  let useCase: SetUserInterestsUseCase;

  beforeEach(() => {
    mockInterestRepo = {
      getUserInterests: jest.fn(),
      setUserInterests: jest.fn(),
    };
    mockTaxonomyRepo = {
      getCategories: jest.fn(),
      getVibes: jest.fn(),
      getTags: jest.fn(),
      getTrendingTags: jest.fn(),
      createCategory: jest.fn(),
      createVibe: jest.fn(),
    };
    useCase = new SetUserInterestsUseCase(mockInterestRepo, mockTaxonomyRepo);
  });

  it('throws error if userId is missing', async () => {
    await expect(useCase.execute('', ['cat-1'])).rejects.toThrow('User ID is required');
  });

  it('throws error if categoryIds is not an array', async () => {
    await expect(useCase.execute('user-123', 'not-an-array' as any)).rejects.toThrow('categoryIds must be an array');
  });

  it('allows empty selection (zero interests)', async () => {
    await useCase.execute('user-123', []);
    expect(mockInterestRepo.setUserInterests).toHaveBeenCalledWith('user-123', []);
    expect(mockTaxonomyRepo.getCategories).not.toHaveBeenCalled();
  });

  it('validates categories against taxonomy repo and saves deduplicated unique IDs', async () => {
    mockTaxonomyRepo.getCategories.mockResolvedValue([
      { id: 'cat-1', name: 'Tech', slug: 'tech', emoji: '💻' },
      { id: 'cat-2', name: 'Design', slug: 'design', emoji: '🎨' },
    ]);

    await useCase.execute('user-123', ['cat-1', 'cat-2', 'cat-1']);

    expect(mockTaxonomyRepo.getCategories).toHaveBeenCalled();
    expect(mockInterestRepo.setUserInterests).toHaveBeenCalledWith('user-123', ['cat-1', 'cat-2']);
  });

  it('throws error if any category ID is invalid', async () => {
    mockTaxonomyRepo.getCategories.mockResolvedValue([
      { id: 'cat-1', name: 'Tech', slug: 'tech', emoji: '💻' },
    ]);

    await expect(useCase.execute('user-123', ['cat-1', 'invalid-id'])).rejects.toThrow('Invalid category ID: invalid-id');
    expect(mockInterestRepo.setUserInterests).not.toHaveBeenCalled();
  });
});
