import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  Query,
  UseGuards,
  Request,
  HttpStatus,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../users/enums/user-role.enum';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { ProductStatus, Product } from './schemas/product.schema';
import { Category } from './schemas/category.schema';
import {
  ProductQueryParams,
  PaginatedProducts,
} from './interfaces/product-query.interface';
import { ApiResponse } from '../../interfaces/api-response.interface';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // Category Routes
  @Post('categories')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async createCategory(
    @Body() createCategoryDto: CreateCategoryDto,
  ): Promise<ApiResponse<Category>> {
    const category =
      await this.productsService.createCategory(createCategoryDto);

    return {
      statusCode: HttpStatus.CREATED,
      message: 'Tạo danh mục thành công',
      data: category,
    };
  }

  @Get('categories')
  async findAllCategories(
    @Query('isActive') isActive?: boolean,
  ): Promise<ApiResponse<Category[]>> {
    const categories = await this.productsService.findAllCategories(isActive);

    return {
      statusCode: HttpStatus.OK,
      message: 'Lấy danh sách danh mục thành công',
      data: categories,
    };
  }

  @Get('categories/:id')
  async findCategoryById(
    @Param('id') id: string,
  ): Promise<ApiResponse<Category>> {
    const category = await this.productsService.findCategoryById(id);

    return {
      statusCode: HttpStatus.OK,
      message: 'Lấy thông tin danh mục thành công',
      data: category,
    };
  }

  @Get('categories/slug/:slug')
  async findCategoryBySlug(
    @Param('slug') slug: string,
  ): Promise<ApiResponse<Category>> {
    const category = await this.productsService.findCategoryBySlug(slug);

    return {
      statusCode: HttpStatus.OK,
      message: 'Lấy thông tin danh mục thành công',
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
    const category = await this.productsService.updateCategory(
      id,
      updateCategoryDto,
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'Cập nhật danh mục thành công',
      data: category,
    };
  }

  @Delete('categories/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async removeCategory(
    @Param('id') id: string,
  ): Promise<ApiResponse<Category>> {
    const category = await this.productsService.removeCategory(id);

    return {
      statusCode: HttpStatus.OK,
      message: 'Xóa danh mục thành công',
      data: category,
    };
  }

  // Product Routes
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async createProduct(
    @Body() createProductDto: CreateProductDto,
  ): Promise<ApiResponse<Product>> {
    const product = await this.productsService.createProduct(createProductDto);

    return {
      statusCode: HttpStatus.CREATED,
      message: 'Tạo sản phẩm thành công',
      data: product,
    };
  }

  @Get()
  async findAllProducts(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('categoryId') categoryId?: string,
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
    @Query('status') status?: string,
    @Query('isActive') isActive?: boolean,
    @Query('tags') tags?: string[],
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ): Promise<ApiResponse<PaginatedProducts>> {
    const queryParams: ProductQueryParams = {
      page: page ? +page : 1,
      limit: limit ? +limit : 10,
      search,
      categoryId,
      minPrice: minPrice ? +minPrice : undefined,
      maxPrice: maxPrice ? +maxPrice : undefined,
      status: status as ProductStatus,
      isActive,
      tags,
      sortBy,
      sortOrder,
    };

    const products = await this.productsService.findAllProducts(queryParams);

    return {
      statusCode: HttpStatus.OK,
      message: 'Lấy danh sách sản phẩm thành công',
      data: products,
    };
  }

  @Get('slug/:slug')
  async findProductBySlug(
    @Param('slug') slug: string,
  ): Promise<ApiResponse<Product>> {
    const product = await this.productsService.findProductBySlug(slug);

    return {
      statusCode: HttpStatus.OK,
      message: 'Lấy thông tin sản phẩm thành công',
      data: product,
    };
  }

  @Get(':id')
  async findProductById(
    @Param('id') id: string,
  ): Promise<ApiResponse<Product>> {
    const product = await this.productsService.findProductById(id);

    return {
      statusCode: HttpStatus.OK,
      message: 'Lấy thông tin sản phẩm thành công',
      data: product,
    };
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async updateProduct(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ): Promise<ApiResponse<Product>> {
    const product = await this.productsService.updateProduct(
      id,
      updateProductDto,
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'Cập nhật sản phẩm thành công',
      data: product,
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async removeProduct(@Param('id') id: string): Promise<ApiResponse<Product>> {
    const product = await this.productsService.removeProduct(id);

    return {
      statusCode: HttpStatus.OK,
      message: 'Xóa sản phẩm thành công',
      data: product,
    };
  }
}
