import { ITaxonomyRepository, Vibe } from "../domain/ITaxonomyRepository";

export class CreateVibeTaxonomyUseCase {
  constructor(private repo: ITaxonomyRepository) {}

  async execute(data: { key: string; label: string }): Promise<Vibe> {
    return this.repo.createVibe(data);
  }
}
