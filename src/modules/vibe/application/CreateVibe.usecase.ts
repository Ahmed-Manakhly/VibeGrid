import { IVibeRepository } from "../domain/IVibeRepository";
import { IEventBus } from "@/shared/domain/events/IEventBus";
import { ICacheService } from "@/shared/application/ports/ICacheService";
import { MediaType } from "@prisma/client";

export class CreateVibeUseCase {
  constructor(
    private vibeRepository: IVibeRepository,
    private eventBus: IEventBus,
    private cacheService?: ICacheService
  ) {}

  async execute(
    content: string,
    mediaUrl?: string,
    mediaType?: MediaType,
    authorId?: string,
    tags?: string[],
    mood?: string,
    categoryId?: string,
    vibeId?: string,
    techContext?: any,
    postType?: any,
    poll?: { question: string; options: string[]; durationHours: number }
  ) {
    if (!authorId) return { success: false as const, error: "No user found!" };
    
    // Combine explicit tags and techStack tags if ship context is provided
    let combinedTags = tags ? [...tags] : [];
    if (techContext?.techStack && Array.isArray(techContext.techStack)) {
      combinedTags.push(...techContext.techStack);
    }

    // Extract hashtags from content if tags aren't explicitly provided
    const rawTags = combinedTags.length > 0 ? combinedTags : (content.match(/#[\w\-]+/g) || []);

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

    const result = await this.vibeRepository.create({ 
      content, 
      mediaUrl,
      mediaType,
      authorId,
      tags: normalizedTags,
      categoryId,
      vibeId,
      techContext,
      postType,
      poll
    });
    if (result.success) {
      if (this.cacheService?.delByPattern) {
        await this.cacheService.delByPattern("feed:query:*");
        await this.cacheService.delByPattern(`timeline:${authorId}`);
      }
      await this.eventBus.publish("VibeCreatedEvent", {
        vibeId: result.value.id,
        authorId,
        timestamp: new Date(),
      });
    }
    return result;
  }
}
