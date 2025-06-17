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
  UseInterceptors,
  UploadedFile,
  HttpStatus,
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
import { UpdateCategoryDto } from './dto/update-category.dto';
import { POSTS_MESSAGE_KEYS } from './constants/message-keys';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './services/upload.service';
import {
  thumbnailMulterConfig,
  contentImageMulterConfig,
} from './config/upload.config';

@Controller('posts')
export class PostsController {
  constructor(
    private readonly postsService: PostsService,
    private readonly uploadService: UploadService,
  ) {}

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
      message_key: POSTS_MESSAGE_KEYS.CATEGORY_CREATED,
      data: category,
    };
  }

  @Get('categories')
  async findAllCategories(
    @Query('isActive') isActive?: boolean | string,
    @Query('type') type?: string,
  ): Promise<ApiResponse<Category[]>> {
    const categories = await this.postsService.findAllCategories(
      isActive,
      type,
    );
    return {
      statusCode: 200,
      message: 'Categories retrieved successfully',
      message_key: POSTS_MESSAGE_KEYS.CATEGORY_FETCH_ALL_SUCCESS,
      data: categories,
    };
  }

  @Get('categories/slug/:slug')
  async findCategoryBySlug(
    @Param('slug') slug: string,
  ): Promise<ApiResponse<Category>> {
    const category = await this.postsService.findCategoryBySlug(slug);
    return {
      statusCode: 200,
      message: 'Category retrieved successfully',
      message_key: POSTS_MESSAGE_KEYS.CATEGORY_FETCH_SUCCESS,
      data: category,
    };
  }

  @Get('categories/:id')
  async findCategoryById(
    @Param('id') id: string,
  ): Promise<ApiResponse<Category>> {
    const category = await this.postsService.findCategoryById(id);
    return {
      statusCode: 200,
      message: 'Category retrieved successfully',
      message_key: POSTS_MESSAGE_KEYS.CATEGORY_FETCH_SUCCESS,
      data: category,
    };
  }

  @Put('categories/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async updateCategory(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ): Promise<ApiResponse<Category>> {
    const category = await this.postsService.updateCategory(
      id,
      updateCategoryDto,
    );
    return {
      statusCode: 200,
      message: 'Category updated successfully',
      message_key: POSTS_MESSAGE_KEYS.CATEGORY_UPDATED,
      data: category,
    };
  }

  @Delete('categories/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async removeCategory(
    @Param('id') id: string,
  ): Promise<ApiResponse<Category>> {
    const deletedCategory = await this.postsService.removeCategory(id);
    return {
      statusCode: 200,
      message: 'Category deleted successfully',
      message_key: POSTS_MESSAGE_KEYS.CATEGORY_DELETED,
      data: deletedCategory,
    };
  }

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
      message_key: POSTS_MESSAGE_KEYS.POST_CREATED,
      data: post,
    };
  }

  @Get()
  async findAll(@Query() query): Promise<ApiResponse<PostSchema[]>> {
    const posts = await this.postsService.findAll(query);
    return {
      statusCode: 200,
      message: 'Posts retrieved successfully',
      message_key: POSTS_MESSAGE_KEYS.POST_FETCH_ALL_SUCCESS,
      data: posts,
    };
  }

  @Get('my-posts')
  @UseGuards(JwtAuthGuard)
  async findMyPosts(
    @Request() req: RequestWithUser,
    @Query() query: any,
  ): Promise<ApiResponse<PostSchema[]>> {
    const posts = await this.postsService.findAll({
      ...query,
      authorId: req.user._id,
    });
    return {
      statusCode: 200,
      message: 'My posts retrieved successfully',
      message_key: POSTS_MESSAGE_KEYS.POST_FETCH_ALL_SUCCESS,
      data: posts,
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ApiResponse<PostSchema>> {
    const post = await this.postsService.findOne(id);
    return {
      statusCode: 200,
      message: 'Post retrieved successfully',
      message_key: POSTS_MESSAGE_KEYS.POST_FETCH_SUCCESS,
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
      throw new BadRequestException({
        message: 'Post not found',
        message_key: POSTS_MESSAGE_KEYS.POST_NOT_FOUND,
      });
    }

    // Kiểm tra quyền sửa bài viết
    const isAuthor = post.authorId._id.toString() === req.user._id.toString();
    const isAdmin = [UserRole.MOD, UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(req.user.role as UserRole);

    if (!isAuthor && !isAdmin) {
      throw new BadRequestException({
        message: 'You do not have permission to update this post',
        message_key: POSTS_MESSAGE_KEYS.POST_UPDATE_FAILED,
      });
    }

    const updatedPost = await this.postsService.update(id, updatePostDto);
    return {
      statusCode: 200,
      message: 'Post updated successfully',
      message_key: POSTS_MESSAGE_KEYS.POST_UPDATED,
      data: updatedPost,
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
  ): Promise<ApiResponse<PostSchema>> {
    // Kiểm tra quyền xóa bài viết
    const post = await this.postsService.findOne(id);
    if (!post) {
      throw new BadRequestException({
        message: 'Post not found',
        message_key: POSTS_MESSAGE_KEYS.POST_NOT_FOUND,
      });
    }

    console.log('Debug info:');
    console.log('Post author ID:', post.authorId);
    console.log('Post author ID type:', typeof post.authorId);
    console.log('User ID from request:', req.user._id);
    console.log('User ID type:', typeof req.user._id);
    console.log('User role:', req.user.role);

    // Kiểm tra quyền xóa bài viết
    const isAuthor = post.authorId._id.toString() === req.user._id.toString();
    const isAdmin = [UserRole.MOD, UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(req.user.role as UserRole);

    console.log('Is author:', isAuthor);
    console.log('Is admin:', isAdmin);

    if (!isAuthor && !isAdmin) {
      throw new BadRequestException({
        message: 'You do not have permission to delete this post',
        message_key: POSTS_MESSAGE_KEYS.POST_DELETE_FAILED,
      });
    }

    const deletedPost = await this.postsService.remove(id);
    return {
      statusCode: 200,
      message: 'Post deleted successfully',
      message_key: POSTS_MESSAGE_KEYS.POST_DELETED,
      data: deletedPost,
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
      message_key: POSTS_MESSAGE_KEYS.COMMENT_CREATED,
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
      message_key: POSTS_MESSAGE_KEYS.COMMENT_FETCH_ALL_SUCCESS,
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
      message_key: POSTS_MESSAGE_KEYS.LIKE_TOGGLED,
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
      message_key: POSTS_MESSAGE_KEYS.LIKE_TOGGLED,
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
      message_key: POSTS_MESSAGE_KEYS.LIKE_FETCH_SUCCESS,
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
      message_key: POSTS_MESSAGE_KEYS.LIKE_FETCH_SUCCESS,
      data: likes,
    };
  }

  // Upload endpoints
  @Post('upload/thumbnail')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file', thumbnailMulterConfig))
  async uploadThumbnail(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ApiResponse<string>> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const fileName = await this.uploadService.processAndSaveThumbnail(file);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Upload thumbnail thành công',
      message_key: POSTS_MESSAGE_KEYS.UPLOAD_SUCCESS,
      data: fileName,
    };
  }

  @Post('upload/content-image')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file', contentImageMulterConfig))
  async uploadContentImage(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ApiResponse<string>> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const fileName = await this.uploadService.processAndSaveContentImage(file);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Upload ảnh thành công',
      message_key: POSTS_MESSAGE_KEYS.UPLOAD_SUCCESS,
      data: fileName,
    };
  }
}
