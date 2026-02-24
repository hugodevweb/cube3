import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from './entities/post.entity';
import { Comment } from './entities/comment.entity';
import { Like } from './entities/like.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { CreateCommentDto } from './dto/create-comment.dto';

@Injectable()
export class PostsService {
  private readonly logger = new Logger(PostsService.name);

  constructor(
    @InjectRepository(Post)
    private readonly postRepo: Repository<Post>,
    @InjectRepository(Comment)
    private readonly commentRepo: Repository<Comment>,
    @InjectRepository(Like)
    private readonly likeRepo: Repository<Like>,
  ) {}

  findAll(): Promise<Post[]> {
    return this.postRepo.find({
      relations: ['comments', 'likes'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Post> {
    const post = await this.postRepo.findOne({
      where: { id },
      relations: ['comments', 'likes'],
    });
    if (!post) {
      throw new NotFoundException(`Post ${id} not found`);
    }
    return post;
  }

  async create(dto: CreatePostDto, authorId: string): Promise<Post> {
    const post = this.postRepo.create({ ...dto, authorId });
    return this.postRepo.save(post);
  }

  async update(id: string, dto: UpdatePostDto, userId: string): Promise<Post> {
    const post = await this.findOne(id);
    if (post.authorId !== userId) {
      throw new ForbiddenException('You can only edit your own posts');
    }
    Object.assign(post, dto);
    return this.postRepo.save(post);
  }

  async remove(id: string, userId: string, userRoles: string[] = []): Promise<void> {
    const post = await this.findOne(id);
    const isAdmin = userRoles.includes('admin');
    if (post.authorId !== userId && !isAdmin) {
      throw new ForbiddenException('You can only delete your own posts');
    }
    await this.postRepo.remove(post);
  }

  async addComment(postId: string, dto: CreateCommentDto, authorId: string): Promise<Comment> {
    const post = await this.findOne(postId);
    const comment = this.commentRepo.create({ ...dto, authorId, post });
    return this.commentRepo.save(comment);
  }

  async toggleLike(postId: string, userId: string): Promise<{ liked: boolean }> {
    const post = await this.findOne(postId);

    const existing = await this.likeRepo.findOne({
      where: { authorId: userId, post: { id: post.id } },
    });

    if (existing) {
      await this.likeRepo.remove(existing);
      this.logger.log(`User ${userId} unliked post ${postId}`);
      return { liked: false };
    }

    const like = this.likeRepo.create({ authorId: userId, post });
    await this.likeRepo.save(like);
    this.logger.log(`User ${userId} liked post ${postId}`);
    return { liked: true };
  }
}
