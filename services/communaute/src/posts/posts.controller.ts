import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiCookieAuth } from '@nestjs/swagger';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Post as PostEntity } from './entities/post.entity';
import { Comment } from './entities/comment.entity';

interface JwtUser {
  sub: string;
  realm_access?: { roles: string[] };
  [key: string]: unknown;
}

@ApiTags('posts')
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  @ApiOperation({ summary: 'List all posts' })
  @ApiResponse({ status: 200, description: 'Array of posts.' })
  findAll(): Promise<PostEntity[]> {
    return this.postsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a post with its comments' })
  @ApiResponse({ status: 200, description: 'Post detail with comments.' })
  @ApiResponse({ status: 404, description: 'Post not found.' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<PostEntity> {
    return this.postsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a post' })
  @ApiCookieAuth('access_token')
  @ApiResponse({ status: 201, description: 'Post created.' })
  @ApiResponse({ status: 401, description: 'Not authenticated.' })
  create(@Body() dto: CreatePostDto, @Req() req: Request): Promise<PostEntity> {
    const user = req.user as JwtUser;
    return this.postsService.create(dto, user.sub);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update a post (author or admin)' })
  @ApiCookieAuth('access_token')
  @ApiResponse({ status: 200, description: 'Post updated.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Post not found.' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePostDto,
    @Req() req: Request,
  ): Promise<PostEntity> {
    const user = req.user as JwtUser;
    return this.postsService.update(id, dto, user.sub);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a post (author or admin)' })
  @ApiCookieAuth('access_token')
  @ApiResponse({ status: 204, description: 'Post deleted.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Post not found.' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: Request,
  ): Promise<void> {
    const user = req.user as JwtUser;
    const roles = user.realm_access?.roles ?? [];
    return this.postsService.remove(id, user.sub, roles);
  }

  @Post(':id/comments')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a comment to a post' })
  @ApiCookieAuth('access_token')
  @ApiResponse({ status: 201, description: 'Comment added.' })
  @ApiResponse({ status: 404, description: 'Post not found.' })
  addComment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateCommentDto,
    @Req() req: Request,
  ): Promise<Comment> {
    const user = req.user as JwtUser;
    return this.postsService.addComment(id, dto, user.sub);
  }

  @Post(':id/like')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Toggle like on a post' })
  @ApiCookieAuth('access_token')
  @ApiResponse({ status: 200, description: 'Returns { liked: boolean }.' })
  toggleLike(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: Request,
  ): Promise<{ liked: boolean }> {
    const user = req.user as JwtUser;
    return this.postsService.toggleLike(id, user.sub);
  }
}
