import { IVibeRepository } from "../domain/IVibeRepository";
// import { vibeRepository } from "../infrastructure/PrismaVibeRepository";
import { DomainEventBus } from "@/shared/infrastructure/EventBus";

export class CreateVibeUseCase {
  constructor(private repo: IVibeRepository) {}

  async execute(content: string, image: string, authorId: string, tags?: string[], mood?: string, categoryId?: string, vibeId?: string) {
    if (!authorId) return { success: false as const, error: "No user found!" };
    
    // Extract hashtags from content if tags aren't explicitly provided
    const finalTags = tags || (content.match(/#[\w]+/g) || []).map(t => t.substring(1));

    const result = await this.repo.create({ 
      content, 
      imageUrl: image, 
      authorId,
      tags: finalTags,
      categoryId,
      vibeId
    });
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
