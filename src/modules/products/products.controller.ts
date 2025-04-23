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
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../users/schemas/user.schema';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { ProductStatus } from './schemas/product.schema';
import {
  ProductQueryParams,
  PaginatedProducts,
} from './interfaces/product-query.interface';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // Product Routes
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async createProduct(@Body() createProductDto: CreateProductDto) {
    return this.productsService.createProduct(createProductDto);
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
  ): Promise<PaginatedProducts> {
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

    return this.productsService.findAllProducts(queryParams);
  }

  @Get(':id')
  async findProductById(@Param('id') id: string) {
    return this.productsService.findProductById(id);
  }

  @Get('slug/:slug')
  async findProductBySlug(@Param('slug') slug: string) {
    return this.productsService.findProductBySlug(slug);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async updateProduct(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productsService.updateProduct(id, updateProductDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async removeProduct(@Param('id') id: string) {
    return this.productsService.removeProduct(id);
  }

  // Category Routes
  @Post('categories')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async createCategory(@Body() createCategoryDto: CreateCategoryDto) {
    return this.productsService.createCategory(createCategoryDto);
  }

  @Get('categories')
  async findAllCategories(@Query('isActive') isActive?: boolean) {
    return this.productsService.findAllCategories(isActive);
  }

  @Get('categories/:id')
  async findCategoryById(@Param('id') id: string) {
    return this.productsService.findCategoryById(id);
  }

  @Get('categories/slug/:slug')
  async findCategoryBySlug(@Param('slug') slug: string) {
    return this.productsService.findCategoryBySlug(slug);
  }

  @Put('categories/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async updateCategory(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.productsService.updateCategory(id, updateCategoryDto);
  }

  @Delete('categories/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async removeCategory(@Param('id') id: string) {
    return this.productsService.removeCategory(id);
  }
}
