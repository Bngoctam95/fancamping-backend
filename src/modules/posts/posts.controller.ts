import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';
import { Types } from 'mongoose';
import { RequestWithUser } from './interfaces/request.interface';
import { ApiResponse } from '../../interfaces/api-response.interface';
import { Post as PostSchema } from './schemas/post.schema';
import { Category } from './schemas/category.schema';
import { Comment } from './schemas/comment.schema';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  // Post endpoints
  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @Body() createPostDto: CreatePostDto,
    @Request() req: RequestWithUser,
  ): Promise<ApiResponse<PostSchema>> {
    const post = await this.postsService.create(createPostDto, req.user._id);
    return {
      statusCode: 201,
      message: 'Post created successfully',
      message_key: 'success.post.created',
      data: post,
    };
  }

  @Get()
  async findAll(@Query() query): Promise<ApiResponse<PostSchema[]>> {
    const posts = await this.postsService.findAll(query);
    return {
      statusCode: 200,
      message: 'Posts retrieved successfully',
      message_key: 'success.posts.retrieved',
      data: posts,
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ApiResponse<PostSchema>> {
    const post = await this.postsService.findOne(id);
    return {
      statusCode: 200,
      message: 'Post retrieved successfully',
      message_key: 'success.post.retrieved',
      data: post,
    };
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @Body() updatePostDto: UpdatePostDto,
    @Request() req: RequestWithUser,
  ): Promise<ApiResponse<PostSchema>> {
    // Kiểm tra quyền sửa bài viết
    const post = await this.postsService.findOne(id);
    if (!post) {
      throw new BadRequestException('Post not found');
    }

    // Kiểm tra quyền sửa bài viết
    if (
      post.authorId.toString() !== req.user._id.toString() &&
      ![UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(
        req.user.role as UserRole,
      )
    ) {
      throw new BadRequestException(
        'You do not have permission to update this post',
      );
    }

    const updatedPost = await this.postsService.update(id, updatePostDto);
    return {
      statusCode: 200,
      message: 'Post updated successfully',
      message_key: 'success.post.updated',
      data: updatedPost,
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
  ): Promise<ApiResponse<undefined>> {
    // Kiểm tra quyền xóa bài viết
    const post = await this.postsService.findOne(id);
    if (!post) {
      throw new BadRequestException('Post not found');
    }

    // Kiểm tra quyền xóa bài viết
    if (
      post.authorId.toString() !== req.user._id.toString() &&
      ![UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(
        req.user.role as UserRole,
      )
    ) {
      throw new BadRequestException(
        'You do not have permission to delete this post',
      );
    }

    await this.postsService.remove(id);
    return {
      statusCode: 200,
      message: 'Post deleted successfully',
      message_key: 'success.post.deleted',
      data: undefined,
    };
  }

  // Category endpoints
  @Post('categories')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async createCategory(
    @Body() createCategoryDto: CreateCategoryDto,
  ): Promise<ApiResponse<Category>> {
    const category = await this.postsService.createCategory(createCategoryDto);
    return {
      statusCode: 201,
      message: 'Category created successfully',
      message_key: 'success.category.created',
      data: category,
    };
  }

  @Get('categories')
  async findAllCategories(): Promise<ApiResponse<Category[]>> {
    const categories = await this.postsService.findAllCategories();
    return {
      statusCode: 200,
      message: 'Categories retrieved successfully',
      message_key: 'success.categories.retrieved',
      data: categories,
    };
  }

  // Comment endpoints
  @Post(':id/comments')
  @UseGuards(JwtAuthGuard)
  async createComment(
    @Param('id') postId: string,
    @Body() createCommentDto: CreateCommentDto,
    @Request() req: RequestWithUser,
  ): Promise<ApiResponse<Comment>> {
    const comment = await this.postsService.createComment(
      { ...createCommentDto, postId: new Types.ObjectId(postId) },
      req.user._id,
    );
    return {
      statusCode: 201,
      message: 'Comment created successfully',
      message_key: 'success.comment.created',
      data: comment,
    };
  }

  @Get(':id/comments')
  async getPostComments(
    @Param('id') postId: string,
  ): Promise<ApiResponse<Comment[]>> {
    const comments = await this.postsService.getPostComments(postId);
    return {
      statusCode: 200,
      message: 'Comments retrieved successfully',
      message_key: 'success.comments.retrieved',
      data: comments,
    };
  }

  // Like endpoints
  @Post(':id/like')
  @UseGuards(JwtAuthGuard)
  async togglePostLike(
    @Param('id') postId: string,
    @Request() req: RequestWithUser,
  ): Promise<ApiResponse<undefined>> {
    await this.postsService.toggleLike(req.user._id, postId, 'post');
    return {
      statusCode: 200,
      message: 'Post like toggled successfully',
      message_key: 'success.post.like.toggled',
      data: undefined,
    };
  }

  @Post('comments/:id/like')
  @UseGuards(JwtAuthGuard)
  async toggleCommentLike(
    @Param('id') commentId: string,
    @Request() req: RequestWithUser,
  ): Promise<ApiResponse<undefined>> {
    await this.postsService.toggleLike(req.user._id, commentId, 'comment');
    return {
      statusCode: 200,
      message: 'Comment like toggled successfully',
      message_key: 'success.comment.like.toggled',
      data: undefined,
    };
  }

  @Get(':id/likes')
  async getPostLikes(
    @Param('id') postId: string,
  ): Promise<ApiResponse<number>> {
    const likes = await this.postsService.getLikes(postId, 'post');
    return {
      statusCode: 200,
      message: 'Post likes retrieved successfully',
      message_key: 'success.post.likes.retrieved',
      data: likes,
    };
  }

  @Get('comments/:id/likes')
  async getCommentLikes(
    @Param('id') commentId: string,
  ): Promise<ApiResponse<number>> {
    const likes = await this.postsService.getLikes(commentId, 'comment');
    return {
      statusCode: 200,
      message: 'Comment likes retrieved successfully',
      message_key: 'success.comment.likes.retrieved',
      data: likes,
    };
  }
}
