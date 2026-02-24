import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { PostsService } from './posts.service';
import { Post } from './entities/post.entity';
import { Comment } from './entities/comment.entity';
import { Like } from './entities/like.entity';

type MockRepo<T> = Partial<Record<keyof Repository<T>, jest.Mock>>;

const mockPostRepo = (): MockRepo<Post> => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
});

const mockCommentRepo = (): MockRepo<Comment> => ({
  create: jest.fn(),
  save: jest.fn(),
});

const mockLikeRepo = (): MockRepo<Like> => ({
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
});

describe('PostsService', () => {
  let service: PostsService;
  let postRepo: MockRepo<Post>;
  let commentRepo: MockRepo<Comment>;
  let likeRepo: MockRepo<Like>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsService,
        { provide: getRepositoryToken(Post), useFactory: mockPostRepo },
        { provide: getRepositoryToken(Comment), useFactory: mockCommentRepo },
        { provide: getRepositoryToken(Like), useFactory: mockLikeRepo },
      ],
    }).compile();

    service = module.get<PostsService>(PostsService);
    postRepo = module.get(getRepositoryToken(Post));
    commentRepo = module.get(getRepositoryToken(Comment));
    likeRepo = module.get(getRepositoryToken(Like));
  });

  describe('findAll', () => {
    it('returns all posts with relations', async () => {
      const posts = [{ id: '1', title: 'Test' }] as Post[];
      postRepo.find!.mockResolvedValue(posts);

      const result = await service.findAll();
      expect(result).toBe(posts);
      expect(postRepo.find).toHaveBeenCalledWith({
        relations: ['comments', 'likes'],
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('findOne', () => {
    it('returns a post when found', async () => {
      const post = { id: 'uuid-1', title: 'Hello' } as Post;
      postRepo.findOne!.mockResolvedValue(post);

      const result = await service.findOne('uuid-1');
      expect(result).toBe(post);
    });

    it('throws NotFoundException when post does not exist', async () => {
      postRepo.findOne!.mockResolvedValue(null);

      await expect(service.findOne('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('creates and saves a new post', async () => {
      const dto = { title: 'New Post', content: 'Some content' };
      const authorId = 'user-1';
      const created = { ...dto, authorId, id: 'uuid-new' } as Post;

      postRepo.create!.mockReturnValue(created);
      postRepo.save!.mockResolvedValue(created);

      const result = await service.create(dto, authorId);
      expect(postRepo.create).toHaveBeenCalledWith({ ...dto, authorId });
      expect(result).toBe(created);
    });
  });

  describe('update', () => {
    it('updates post when user is the author', async () => {
      const post = { id: 'uuid-1', title: 'Old', content: 'Old content', authorId: 'user-1' } as Post;
      postRepo.findOne!.mockResolvedValue(post);
      postRepo.save!.mockResolvedValue({ ...post, title: 'Updated' });

      const result = await service.update('uuid-1', { title: 'Updated' }, 'user-1');
      expect(result.title).toBe('Updated');
    });

    it('throws ForbiddenException when user is not the author', async () => {
      const post = { id: 'uuid-1', authorId: 'user-1' } as Post;
      postRepo.findOne!.mockResolvedValue(post);

      await expect(service.update('uuid-1', { title: 'X' }, 'user-2')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('removes post when user is the author', async () => {
      const post = { id: 'uuid-1', authorId: 'user-1' } as Post;
      postRepo.findOne!.mockResolvedValue(post);
      postRepo.remove!.mockResolvedValue(post);

      await service.remove('uuid-1', 'user-1');
      expect(postRepo.remove).toHaveBeenCalledWith(post);
    });

    it('removes post when user is admin', async () => {
      const post = { id: 'uuid-1', authorId: 'user-1' } as Post;
      postRepo.findOne!.mockResolvedValue(post);
      postRepo.remove!.mockResolvedValue(post);

      await service.remove('uuid-1', 'user-2', ['admin']);
      expect(postRepo.remove).toHaveBeenCalledWith(post);
    });

    it('throws ForbiddenException for non-author non-admin', async () => {
      const post = { id: 'uuid-1', authorId: 'user-1' } as Post;
      postRepo.findOne!.mockResolvedValue(post);

      await expect(service.remove('uuid-1', 'user-2')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('toggleLike', () => {
    it('creates a like when none exists', async () => {
      const post = { id: 'uuid-1' } as Post;
      postRepo.findOne!.mockResolvedValue(post);
      likeRepo.findOne!.mockResolvedValue(null);
      const like = { id: 'like-1' } as Like;
      likeRepo.create!.mockReturnValue(like);
      likeRepo.save!.mockResolvedValue(like);

      const result = await service.toggleLike('uuid-1', 'user-1');
      expect(result).toEqual({ liked: true });
      expect(likeRepo.save).toHaveBeenCalledWith(like);
    });

    it('removes an existing like', async () => {
      const post = { id: 'uuid-1' } as Post;
      postRepo.findOne!.mockResolvedValue(post);
      const existingLike = { id: 'like-1' } as Like;
      likeRepo.findOne!.mockResolvedValue(existingLike);
      likeRepo.remove!.mockResolvedValue(existingLike);

      const result = await service.toggleLike('uuid-1', 'user-1');
      expect(result).toEqual({ liked: false });
      expect(likeRepo.remove).toHaveBeenCalledWith(existingLike);
    });
  });
});
