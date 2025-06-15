import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, FilterQuery, SortOrder } from 'mongoose';
import { Product, ProductDocument } from './schemas/product.schema';
import { Category, CategoryDocument } from './schemas/category.schema';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import {
  ProductQueryParams,
  PaginatedProducts,
} from './interfaces/product-query.interface';
import { PRODUCTS_MESSAGE_KEYS } from './constants/message-keys';

// Định nghĩa kiểu cho price filter
interface PriceFilter {
  $gte?: number;
  $lte?: number;
}

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
  ) { }

  // Product Methods
  async createProduct(createProductDto: CreateProductDto): Promise<Product> {
    // Kiểm tra slug đã tồn tại
    const existingProduct = await this.productModel.findOne({
      slug: createProductDto.slug,
    });

    if (existingProduct) {
      throw new ConflictException({
        message: 'Product slug already exists',
        message_key: PRODUCTS_MESSAGE_KEYS.PRODUCT_ALREADY_EXISTS,
      });
    }

    // Kiểm tra danh mục có tồn tại
    const category = await this.categoryModel.findById(
      createProductDto.categoryId,
    );
    if (!category) {
      throw new NotFoundException({
        message: 'Category not found',
        message_key: PRODUCTS_MESSAGE_KEYS.CATEGORY_NOT_FOUND,
      });
    }

    try {
      // Tạo sản phẩm mới
      const newProduct = new this.productModel(createProductDto);
      return newProduct.save();
    } catch {
      throw new BadRequestException({
        message: 'Failed to create product',
        message_key: PRODUCTS_MESSAGE_KEYS.PRODUCT_CREATE_FAILED,
      });
    }
  }

  async findAllProducts(
    queryParams: ProductQueryParams,
  ): Promise<PaginatedProducts> {
    const {
      page = 1,
      limit = 10,
      search,
      categoryId,
      minPrice,
      maxPrice,
      status,
      isActive = true,
      tags,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = queryParams;

    const skip = (page - 1) * limit;
    const query: FilterQuery<ProductDocument> = {};

    // Chỉ lấy sản phẩm đang hoạt động
    if (isActive !== undefined) {
      query.isActive = isActive;
    }

    // Tìm kiếm theo từ khóa
    if (search) {
      query.$text = { $search: search };
    }

    // Lọc theo danh mục
    if (categoryId) {
      query.categoryId = categoryId;
    }

    // Lọc theo giá
    if (minPrice !== undefined || maxPrice !== undefined) {
      const priceFilter: PriceFilter = {};
      if (minPrice !== undefined) {
        priceFilter.$gte = minPrice;
      }
      if (maxPrice !== undefined) {
        priceFilter.$lte = maxPrice;
      }
      query.price = priceFilter;
    }

    // Lọc theo trạng thái
    if (status) {
      query.status = status;
    }

    // Lọc theo tags
    if (tags && tags.length > 0) {
      query.tags = { $in: tags };
    }

    // Đếm tổng số sản phẩm
    const total = await this.productModel.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    // Xác định hướng sắp xếp
    const sortDirection = sortOrder === 'asc' ? 1 : -1;
    const sortOptions: Record<string, SortOrder> = { [sortBy]: sortDirection };

    // Lấy danh sách sản phẩm
    const products = await this.productModel
      .find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .populate('categoryId', 'name slug')
      .exec();

    return {
      items: products,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async findProductById(id: string): Promise<Product> {
    const product = await this.productModel
      .findById(id)
      .populate('categoryId', 'name slug')
      .exec();

    if (!product) {
      throw new NotFoundException({
        message: 'Product not found',
        message_key: PRODUCTS_MESSAGE_KEYS.PRODUCT_NOT_FOUND,
      });
    }

    return product;
  }

  async findProductBySlug(slug: string): Promise<Product> {
    const product = await this.productModel
      .findOne({ slug, isActive: true })
      .populate('categoryId', 'name slug')
      .exec();

    if (!product) {
      throw new NotFoundException({
        message: 'Product not found',
        message_key: PRODUCTS_MESSAGE_KEYS.PRODUCT_NOT_FOUND,
      });
    }

    return product;
  }

  async updateProduct(
    id: string,
    updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    // Kiểm tra slug đã tồn tại (nếu có cập nhật slug)
    if (updateProductDto.slug) {
      const existingProduct = await this.productModel.findOne({
        slug: updateProductDto.slug,
        _id: { $ne: id },
      });

      if (existingProduct) {
        throw new ConflictException({
          message: 'Product slug already exists',
          message_key: PRODUCTS_MESSAGE_KEYS.PRODUCT_ALREADY_EXISTS,
        });
      }
    }

    // Kiểm tra danh mục có tồn tại (nếu có cập nhật danh mục)
    if (updateProductDto.categoryId) {
      const category = await this.categoryModel.findById(
        updateProductDto.categoryId,
      );
      if (!category) {
        throw new NotFoundException({
          message: 'Category not found',
          message_key: PRODUCTS_MESSAGE_KEYS.CATEGORY_NOT_FOUND,
        });
      }
    }

    // Cập nhật sản phẩm
    const updatedProduct = await this.productModel
      .findByIdAndUpdate(id, updateProductDto, { new: true })
      .populate('categoryId', 'name slug')
      .exec();

    if (!updatedProduct) {
      throw new NotFoundException({
        message: 'Product not found',
        message_key: PRODUCTS_MESSAGE_KEYS.PRODUCT_NOT_FOUND,
      });
    }

    return updatedProduct;
  }

  async removeProduct(id: string): Promise<Product> {
    const deletedProduct = await this.productModel.findByIdAndDelete(id).exec();

    if (!deletedProduct) {
      throw new NotFoundException({
        message: 'Product not found',
        message_key: PRODUCTS_MESSAGE_KEYS.PRODUCT_NOT_FOUND,
      });
    }

    return deletedProduct;
  }

  // Category Methods
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
        message_key: PRODUCTS_MESSAGE_KEYS.CATEGORY_ALREADY_EXISTS,
      });
    }

    try {
      // Tạo danh mục mới
      const newCategory = new this.categoryModel(createCategoryDto);
      return newCategory.save();
    } catch {
      throw new BadRequestException({
        message: 'Failed to create category',
        message_key: PRODUCTS_MESSAGE_KEYS.CATEGORY_CREATE_FAILED,
      });
    }
  }

  async findAllCategories(isActive?: boolean | string, type?: string): Promise<Category[]> {
    try {
      const query: FilterQuery<CategoryDocument> = {};

      // Chuyển đổi isActive từ string sang boolean
      if (isActive !== undefined) {
        // Convert string 'true'/'false' to boolean
        query.isActive = isActive === true || isActive === 'true';
      }

      // Filter by type if provided
      if (type) {
        query.type = type;
      }

      const categories = await this.categoryModel
        .find(query)
        .sort({ order: 1, name: 1 })
        .exec();

      return categories;
    } catch (error) {
      console.error('Error in findAllCategories:', error);
      throw error;
    }
  }

  async findCategoryById(id: string): Promise<Category> {
    const category = await this.categoryModel.findById(id).exec();

    if (!category) {
      throw new NotFoundException({
        message: 'Category not found',
        message_key: PRODUCTS_MESSAGE_KEYS.CATEGORY_NOT_FOUND,
      });
    }

    return category;
  }

  async findCategoryBySlug(slug: string): Promise<Category> {
    const category = await this.categoryModel.findOne({ slug }).exec();

    if (!category) {
      throw new NotFoundException({
        message: 'Category not found',
        message_key: PRODUCTS_MESSAGE_KEYS.CATEGORY_NOT_FOUND,
      });
    }

    return category;
  }

  async updateCategory(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<Category> {
    // Kiểm tra slug đã tồn tại (nếu có cập nhật slug)
    if (updateCategoryDto.slug) {
      const existingCategory = await this.categoryModel.findOne({
        slug: updateCategoryDto.slug,
        _id: { $ne: id },
      });

      if (existingCategory) {
        throw new ConflictException({
          message: 'Category slug already exists',
          message_key: PRODUCTS_MESSAGE_KEYS.CATEGORY_ALREADY_EXISTS,
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
        message_key: PRODUCTS_MESSAGE_KEYS.CATEGORY_NOT_FOUND,
      });
    }

    return updatedCategory;
  }

  async removeCategory(id: string): Promise<Category> {
    // Kiểm tra xem danh mục có sản phẩm nào không
    const productCount = await this.productModel.countDocuments({
      categoryId: id,
    });
    if (productCount > 0) {
      throw new BadRequestException({
        message: 'Cannot delete category with existing products',
        message_key: PRODUCTS_MESSAGE_KEYS.CATEGORY_DELETE_FAILED,
      });
    }

    // Xóa danh mục
    const deletedCategory = await this.categoryModel
      .findByIdAndDelete(id)
      .exec();

    if (!deletedCategory) {
      throw new NotFoundException({
        message: 'Category not found',
        message_key: PRODUCTS_MESSAGE_KEYS.CATEGORY_NOT_FOUND,
      });
    }

    return deletedCategory;
  }
}
