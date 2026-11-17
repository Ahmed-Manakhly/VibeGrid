import { IMessagingRepository } from "../domain/IMessagingRepository";
import { ConversationEntity } from "../domain/MessageEntities";
import { ITrustSafetyRepository } from "@/modules/safety/domain/ITrustSafetyRepository";
import { ISocialRepository } from "@/modules/social/domain/ISocialRepository";
import { ICommunityRepository } from "@/modules/community/domain/ICommunityRepository";

export class StartConversationUseCase {
  constructor(
    private readonly messagingRepo: IMessagingRepository,
    private readonly safetyRepo?: ITrustSafetyRepository,
    private readonly socialRepo?: ISocialRepository,
    private readonly communityRepo?: ICommunityRepository
  ) {}

  async execute(currentUserId: string, targetUserId: string): Promise<ConversationEntity> {
    if (!currentUserId || !targetUserId) {
      throw new Error("Invalid parameters for starting conversation");
    }
    if (currentUserId === targetUserId) {
      throw new Error("Cannot start a conversation with yourself");
    }

    if (this.safetyRepo) {
      const isBlocked = await this.safetyRepo.isBlocked(currentUserId, targetUserId);
      if (isBlocked) {
        throw new Error("Cannot start a conversation with a blocked user");
      }
    }

    // Permission gate: require following each other (either direction) OR sharing at least one common guild/community
    if (this.socialRepo) {
      const [followsTarget, followedByTarget] = await Promise.all([
        this.socialRepo.getFollow(currentUserId, targetUserId),
        this.socialRepo.getFollow(targetUserId, currentUserId),
      ]);

      const isFollowing = Boolean(followsTarget || followedByTarget);

      if (!isFollowing) {
        let sharesCommunity = false;
        if (this.communityRepo) {
          const [userComms, targetComms] = await Promise.all([
            this.communityRepo.getUserCommunities(currentUserId),
            this.communityRepo.getUserCommunities(targetUserId),
          ]);
          const userCommIds = new Set(userComms.map((c) => c.id));
          sharesCommunity = targetComms.some((c) => userCommIds.has(c.id));
        }

        if (!sharesCommunity) {
          throw new Error("Direct messaging requires following each other or sharing a guild.");
        }
      }
    }

    return await this.messagingRepo.findOrCreateDirectConversation(currentUserId, targetUserId);
  }
}

