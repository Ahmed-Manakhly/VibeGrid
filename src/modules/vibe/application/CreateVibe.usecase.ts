import { IVibeRepository } from "../domain/IVibeRepository";
// import { vibeRepository } from "../infrastructure/PrismaVibeRepository";
import { DomainEventBus } from "@/shared/infrastructure/EventBus";

export class CreateVibeUseCase {
  constructor(private repo: IVibeRepository) {}

  async execute(content: string, image: string, authorId: string) {
    const result = await this.repo.create({ content, image, authorId });
    if (result.success) {
      DomainEventBus.publish("VibeCreatedEvent", {
        vibeId: result.value.id,
        authorId,
        timestamp: new Date(),
      });
    }
    return result;
  }
}
