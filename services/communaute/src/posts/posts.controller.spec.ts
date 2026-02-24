import { Test, TestingModule } from '@nestjs/testing';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { Post } from './entities/post.entity';
import { Comment } from './entities/comment.entity';

const mockPostsService = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  addComment: jest.fn(),
  toggleLike: jest.fn(),
};

const mockRequest = (sub: string, roles: string[] = []) => ({
  user: { sub, realm_access: { roles } },
});

describe('PostsController', () => {
  let controller: PostsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PostsController],
      providers: [{ provide: PostsService, useValue: mockPostsService }],
    }).compile();

    controller = module.get<PostsController>(PostsController);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('returns all posts', async () => {
      const posts = [{ id: '1' }] as Post[];
      mockPostsService.findAll.mockResolvedValue(posts);

      const result = await controller.findAll();
      expect(result).toBe(posts);
      expect(mockPostsService.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('returns a single post', async () => {
      const post = { id: 'uuid-1' } as Post;
      mockPostsService.findOne.mockResolvedValue(post);

      const result = await controller.findOne('uuid-1');
      expect(result).toBe(post);
      expect(mockPostsService.findOne).toHaveBeenCalledWith('uuid-1');
    });
  });

  describe('create', () => {
    it('creates a post with the authenticated user id', async () => {
      const dto = { title: 'New', content: 'Content' };
      const post = { id: 'uuid-new', ...dto, authorId: 'user-1' } as Post;
      mockPostsService.create.mockResolvedValue(post);

      const req = mockRequest('user-1') as any;
      const result = await controller.create(dto, req);
      expect(mockPostsService.create).toHaveBeenCalledWith(dto, 'user-1');
      expect(result).toBe(post);
    });
  });

  describe('update', () => {
    it('updates a post with the authenticated user id', async () => {
      const dto = { title: 'Updated' };
      const post = { id: 'uuid-1', title: 'Updated' } as Post;
      mockPostsService.update.mockResolvedValue(post);

      const req = mockRequest('user-1') as any;
      const result = await controller.update('uuid-1', dto, req);
      expect(mockPostsService.update).toHaveBeenCalledWith('uuid-1', dto, 'user-1');
      expect(result).toBe(post);
    });
  });

  describe('remove', () => {
    it('removes a post passing roles from the token', async () => {
      mockPostsService.remove.mockResolvedValue(undefined);

      const req = mockRequest('user-1', ['admin']) as any;
      await controller.remove('uuid-1', req);
      expect(mockPostsService.remove).toHaveBeenCalledWith('uuid-1', 'user-1', ['admin']);
    });
  });

  describe('addComment', () => {
    it('adds a comment to a post', async () => {
      const dto = { content: 'Great post!' };
      const comment = { id: 'comment-1', content: 'Great post!' } as Comment;
      mockPostsService.addComment.mockResolvedValue(comment);

      const req = mockRequest('user-1') as any;
      const result = await controller.addComment('uuid-1', dto, req);
      expect(mockPostsService.addComment).toHaveBeenCalledWith('uuid-1', dto, 'user-1');
      expect(result).toBe(comment);
    });
  });

  describe('toggleLike', () => {
    it('toggles like on a post', async () => {
      mockPostsService.toggleLike.mockResolvedValue({ liked: true });

      const req = mockRequest('user-1') as any;
      const result = await controller.toggleLike('uuid-1', req);
      expect(mockPostsService.toggleLike).toHaveBeenCalledWith('uuid-1', 'user-1');
      expect(result).toEqual({ liked: true });
    });
  });
});
