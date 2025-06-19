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
  avatar: {
    maxSize: 2 * 1024 * 1024, // 2MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'] as string[],
    dimensions: {
      width: 400,
      height: 400,
      fit: 'cover' as const,
    },
    quality: 90,
    path: 'users',
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
  if (!UPLOAD_CONFIG.avatar.allowedTypes.includes(file.mimetype)) {
    return callback(new Error('Only image files are allowed!'), false);
  }
  callback(null, true);
};

// Cấu hình Multer cho avatar
export const avatarMulterConfig: MulterOptions = {
  limits: {
    fileSize: UPLOAD_CONFIG.avatar.maxSize,
  },
  fileFilter: fileFilter,
  storage: memoryStorage(),
};
