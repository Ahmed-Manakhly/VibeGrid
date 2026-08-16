import { IVibeRepository } from "../domain/IVibeRepository";
// import { vibeRepository } from "../infrastructure/PrismaVibeRepository";
import { DomainEventBus } from "@/shared/infrastructure/EventBus";

export class CreateVibeUseCase {
  constructor(private repo: IVibeRepository) {}

  async execute(content: string, image: string, authorId: string, tags?: string[], mood?: string, categoryId?: string, vibeId?: string) {
    if (!authorId) return { success: false as const, error: "No user found!" };
    
    // Extract hashtags from content if tags aren't explicitly provided
    const rawTags = tags && tags.length > 0 ? tags : (content.match(/#[\w\-]+/g) || []);

    const normalizedTags = Array.from(new Set(
      rawTags
        .map(t => {
          let cleaned = t.trim().toLowerCase();
          if (cleaned.startsWith('#')) {
            cleaned = cleaned.substring(1);
          }
          // Replace internal spaces with hyphens
          cleaned = cleaned.replace(/\s+/g, '-');
          // Remove invalid surrounding characters
          cleaned = cleaned.replace(/^[^\w\-]+|[^\w\-]+$/g, '');
          return cleaned;
        })
        .filter(t => t.length > 0)
    ));

    const result = await this.repo.create({ 
      content, 
      imageUrl: image, 
      authorId,
      tags: normalizedTags,
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
