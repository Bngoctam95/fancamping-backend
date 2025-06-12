import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { memoryStorage } from 'multer';
import { extname } from 'path';
import { Request } from 'express';

export interface ImageConfig {
  maxSize: number;
  allowedTypes: string[];
  dimensions: {
    width: number;
    height: number;
    fit: 'cover' | 'contain' | 'inside';
  };
  quality: number;
  path: string;
}

export const UPLOAD_CONFIG = {
  thumbnail: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'] as string[],
    dimensions: {
      width: 1200,
      height: 800,
      fit: 'cover' as const,
    },
    quality: 90,
    path: 'products/thumbnails',
  },
  slider: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'] as string[],
    dimensions: {
      width: 1200,
      height: 800,
      fit: 'inside' as const,
    },
    quality: 90,
    path: 'products/slider',
  },
} as const;

// Hàm tạo tên file duy nhất
export const generateFileName = (
  req: Request,
  file: Express.Multer.File,
  callback: (error: Error | null, filename: string) => void,
) => {
  // Tạo tên file gồm timestamp và 6 ký tự random
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e6);
  // Lấy phần mở rộng của file gốc
  const ext = extname(file.originalname);
  // Tạo tên file mới
  callback(null, `${uniqueSuffix}${ext}`);
};

// Hàm filter file
export const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  callback: (error: Error | null, acceptFile: boolean) => void,
) => {
  // Kiểm tra type của file
  if (!UPLOAD_CONFIG.thumbnail.allowedTypes.includes(file.mimetype)) {
    return callback(new Error('Only image files are allowed!'), false);
  }
  callback(null, true);
};

// Cấu hình Multer cho thumbnail
export const thumbnailMulterConfig: MulterOptions = {
  limits: {
    fileSize: UPLOAD_CONFIG.thumbnail.maxSize,
  },
  fileFilter: fileFilter,
  storage: memoryStorage(),
};

// Cấu hình Multer cho slider
export const sliderMulterConfig: MulterOptions = {
  limits: {
    fileSize: UPLOAD_CONFIG.slider.maxSize,
  },
  fileFilter: fileFilter,
  storage: memoryStorage(),
};
