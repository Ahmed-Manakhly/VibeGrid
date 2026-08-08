import { Result } from "@/shared/kernel/Result";
import { Prisma } from "@prisma/client";

export type VibeFeedItem = Prisma.PostGetPayload<{
  include: {
    author: {
      select: { id: true; name: true; image: true; username: true };
    };
    comments: {
      include: {
        author: {
          select: { id: true; name: true; image: true; username: true };
        };
      };
    };
    likes: { select: { userId: true } };
    _count: { select: { likes: true; comments: true } };
  };
}>;

export interface CreateVibeDTO {
  content: string;
  image: string;
  authorId: string;
  tags?: string[];
  mood?: string;
}

export interface IVibeRepository {
  create(data: CreateVibeDTO): Promise<Result<any>>;
  delete(id: string, authorId: string): Promise<Result<void>>;
  getFeed(): Promise<VibeFeedItem[]>;
}
