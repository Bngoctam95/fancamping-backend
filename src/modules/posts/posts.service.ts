import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Post, PostDocument } from './schemas/post.schema';
import { Category, CategoryDocument } from './schemas/category.schema';
import { Comment, CommentDocument } from './schemas/comment.schema';
import { Like, LikeDocument } from './schemas/like.schema';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { POSTS_MESSAGE_KEYS } from './constants/message-keys';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class PostsService {
  constructor(
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
    @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
    @InjectModel(Like.name) private likeModel: Model<LikeDocument>,
  ) {}

  // Post methods
  async create(
    createPostDto: CreatePostDto,
    authorId: Types.ObjectId,
  ): Promise<Post> {
    const category = await this.categoryModel.findById(
      createPostDto.categoryId,
    );
    if (!category) {
      throw new BadRequestException('Category not found');
    }

    // Check for duplicate slug
    const existingPost = await this.postModel.findOne({
      slug: createPostDto.slug,
    });
    if (existingPost) {
      throw new ConflictException({
        message: 'Post with this slug already exists',
        message_key: POSTS_MESSAGE_KEYS.POST_ALREADY_EXISTS,
      });
    }

    // Validate status for user role
    if (
      createPostDto.status &&
      !['draft', 'pending'].includes(createPostDto.status)
    ) {
      throw new BadRequestException(
        'Invalid status. Only draft or pending is allowed',
      );
    }

    const post = new this.postModel({
      ...createPostDto,
      authorId,
      published: false,
      status: createPostDto.status || 'draft', // Use provided status or default to draft
    });

    return post.save();
  }

  async findAll(query: any = {}): Promise<Post[]> {
    const filter: any = {};

    // Filter by category
    if (query.categoryId) {
      filter.categoryId = new Types.ObjectId(query.categoryId);
    }

    // Filter by author
    if (query.authorId) {
      filter.authorId = new Types.ObjectId(query.authorId);
    }

    // Filter by type
    if (query.type) {
      filter.type = query.type;
    }

    // Filter by status
    if (query.status) {
      filter.status = query.status;
    }

    // Search by title or content
    if (query.search) {
      filter.$or = [
        { title: { $regex: query.search, $options: 'i' } },
        { content: { $regex: query.search, $options: 'i' } },
      ];
    }

    return this.postModel
      .find(filter)
      .populate({
        path: 'authorId',
        select: 'name email avatar',
      })
      .populate('categoryId', 'name')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string): Promise<Post> {
    const post = await this.postModel
      .findById(id)
      .populate('authorId', 'name email avatar')
      .populate('categoryId', 'name')
      .exec();

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    return post;
  }

  async findPostBySlug(slug: string): Promise<Post> {
    const post = await this.postModel
      .findOne({ slug })
      .populate('authorId', 'name email avatar')
      .populate('categoryId', 'name')
      .exec();

    if (!post) {
      throw new NotFoundException({
        message: 'Post not found',
        message_key: POSTS_MESSAGE_KEYS.POST_NOT_FOUND,
      });
    }

    return post;
  }

  async update(id: string, updatePostDto: UpdatePostDto): Promise<Post> {
    const existingPost = await this.postModel.findById(id);
    if (!existingPost) {
      throw new NotFoundException('Post not found');
    }

    if (updatePostDto.categoryId) {
      const category = await this.categoryModel.findById(
        updatePostDto.categoryId,
      );
      if (!category) {
        throw new BadRequestException('Category not found');
      }
    }

    // Validate status if provided
    if (
      updatePostDto.status &&
      !['draft', 'pending', 'published', 'archived', 'rejected'].includes(
        updatePostDto.status,
      )
    ) {
      throw new BadRequestException(
        'Invalid status. Only draft, pending, published, archived, or rejected is allowed',
      );
    }

    // If status is being changed to rejected, ensure rejection reason is provided
    if (updatePostDto.status === 'rejected' && !updatePostDto.rejectionReason) {
      throw new BadRequestException(
        'Rejection reason is required when rejecting a post',
      );
    }

    const updatedPost = await this.postModel
      .findByIdAndUpdate(id, updatePostDto, { new: true, runValidators: true })
      .populate('authorId', 'name email avatar')
      .populate('categoryId', 'name')
      .exec();

    if (!updatedPost) {
      throw new NotFoundException('Post not found');
    }

    return updatedPost;
  }

  async remove(id: string): Promise<Post> {
    const post = await this.postModel.findById(id);
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    await this.postModel.deleteOne({ _id: id });
    return post;
  }

  // Category methods
  async createCategory(
    createCategoryDto: CreateCategoryDto,
  ): Promise<Category> {
    // Kiểm tra slug đã tồn tại
    const existingCategory = await this.categoryModel.findOne({
      slug: createCategoryDto.slug,
    });

    if (existingCategory) {
      throw new ConflictException({
        message: 'Category slug already exists',
        message_key: POSTS_MESSAGE_KEYS.CATEGORY_ALREADY_EXISTS,
      });
    }

    try {
      // Tạo danh mục mới
      const newCategory = new this.categoryModel(createCategoryDto);
      return newCategory.save();
    } catch (error) {
      throw new BadRequestException({
        message: 'Failed to create category',
        message_key: POSTS_MESSAGE_KEYS.CATEGORY_CREATE_FAILED,
      });
    }
  }

  async findAllCategories(
    isActive?: boolean | string,
    type?: string,
  ): Promise<Category[]> {
    const query: any = {};

    // Filter by isActive
    if (isActive !== undefined) {
      query.isActive = isActive === true || isActive === 'true';
    }

    // Filter by type
    if (type) {
      query.type = type;
    }

    return this.categoryModel.find(query).sort({ order: 1, name: 1 }).exec();
  }

  async findCategoryById(id: string): Promise<Category> {
    const category = await this.categoryModel.findById(id).exec();

    if (!category) {
      throw new NotFoundException({
        message: 'Category not found',
        message_key: POSTS_MESSAGE_KEYS.CATEGORY_NOT_FOUND,
      });
    }

    return category;
  }

  async findCategoryBySlug(slug: string): Promise<Category> {
    const category = await this.categoryModel.findOne({ slug }).exec();

    if (!category) {
      throw new NotFoundException({
        message: 'Category not found',
        message_key: POSTS_MESSAGE_KEYS.CATEGORY_NOT_FOUND,
      });
    }

    return category;
  }

  async updateCategory(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<Category> {
    // Kiểm tra slug đã tồn tại (nếu cập nhật slug)
    if (updateCategoryDto.slug) {
      const existingCategory = await this.categoryModel.findOne({
        slug: updateCategoryDto.slug,
        _id: { $ne: id },
      });

      if (existingCategory) {
        throw new ConflictException({
          message: 'Category slug already exists',
          message_key: POSTS_MESSAGE_KEYS.CATEGORY_ALREADY_EXISTS,
        });
      }
    }

    // Cập nhật danh mục
    const updatedCategory = await this.categoryModel
      .findByIdAndUpdate(id, updateCategoryDto, { new: true })
      .exec();

    if (!updatedCategory) {
      throw new NotFoundException({
        message: 'Category not found',
        message_key: POSTS_MESSAGE_KEYS.CATEGORY_NOT_FOUND,
      });
    }

    return updatedCategory;
  }

  async removeCategory(id: string): Promise<Category> {
    // Kiểm tra xem danh mục có bài viết nào không
    const postCount = await this.postModel.countDocuments({
      categoryId: id,
    });
    if (postCount > 0) {
      throw new BadRequestException({
        message: 'Cannot delete category with existing posts',
        message_key: POSTS_MESSAGE_KEYS.CATEGORY_DELETE_FAILED,
      });
    }

    // Xóa danh mục
    const deletedCategory = await this.categoryModel
      .findByIdAndDelete(id)
      .exec();

    if (!deletedCategory) {
      throw new NotFoundException({
        message: 'Category not found',
        message_key: POSTS_MESSAGE_KEYS.CATEGORY_NOT_FOUND,
      });
    }

    return deletedCategory;
  }

  // Comment methods
  async createComment(
    createCommentDto: CreateCommentDto,
    authorId: Types.ObjectId,
  ): Promise<Comment> {
    const post = await this.postModel.findById(createCommentDto.postId);
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (createCommentDto.parentId) {
      const parentComment = await this.commentModel.findById(
        createCommentDto.parentId,
      );
      if (!parentComment) {
        throw new NotFoundException('Parent comment not found');
      }
    }

    const comment = new this.commentModel({
      ...createCommentDto,
      authorId,
    });

    const savedComment = await comment.save();

    // Update post comment count
    await this.postModel.findByIdAndUpdate(createCommentDto.postId, {
      $inc: { commentCount: 1 },
    });

    return savedComment;
  }

  async getPostComments(postId: string): Promise<Comment[]> {
    return this.commentModel
      .find({ postId, status: 'active' })
      .populate('authorId', 'name email')
      .sort({ createdAt: -1 })
      .exec();
  }

  // Like methods
  async toggleLike(
    userId: Types.ObjectId,
    targetId: string,
    targetType: 'post' | 'comment',
  ): Promise<void> {
    const existingLike = await this.likeModel.findOne({
      userId,
      targetId: new Types.ObjectId(targetId),
      targetType,
    });

    if (existingLike) {
      await this.likeModel.deleteOne({ _id: existingLike._id });
      if (targetType === 'post') {
        await this.postModel.findByIdAndUpdate(targetId, {
          $inc: { likeCount: -1 },
        });
      } else {
        await this.commentModel.findByIdAndUpdate(targetId, {
          $inc: { likeCount: -1 },
        });
      }
    } else {
      await this.likeModel.create({
        userId,
        targetId: new Types.ObjectId(targetId),
        targetType,
      });
      if (targetType === 'post') {
        await this.postModel.findByIdAndUpdate(targetId, {
          $inc: { likeCount: 1 },
        });
      } else {
        await this.commentModel.findByIdAndUpdate(targetId, {
          $inc: { likeCount: 1 },
        });
      }
    }
  }

  async getLikes(
    targetId: string,
    targetType: 'post' | 'comment',
  ): Promise<number> {
    return this.likeModel.countDocuments({
      targetId: new Types.ObjectId(targetId),
      targetType,
    });
  }
}
