import { Injectable, BadRequestException } from '@nestjs/common';
import * as sharp from 'sharp';
import * as fs from 'fs';
import * as path from 'path';
import { UPLOAD_CONFIG } from '../config/upload.config';

@Injectable()
export class UploadService {
  async processAndSaveAvatar(file: Express.Multer.File): Promise<string> {
    try {
      const { dimensions, quality, path: uploadPath } = UPLOAD_CONFIG.avatar;

      // Tạo buffer từ file upload
      const processedImage = await sharp(file.buffer)
        .resize(dimensions.width, dimensions.height, {
          fit: dimensions.fit,
          position: 'center',
        })
        .jpeg({ quality })
        .toBuffer();

      // Tạo tên file duy nhất
      const fileName = `${Date.now()}-${Math.round(Math.random() * 1e6)}.jpg`;

      // Tạo đường dẫn đầy đủ
      const uploadDir = path.join(process.cwd(), 'uploads', uploadPath);
      const filePath = path.join(uploadDir, fileName);

      // Đảm bảo thư mục tồn tại
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      // Lưu file
      await fs.promises.writeFile(filePath, processedImage);

      // Trả về chỉ tên file
      return fileName;
    } catch (error) {
      console.error('Error in processAndSaveAvatar:', error);
      throw new BadRequestException('Failed to process avatar image');
    }
  }

  // Phương thức xóa file
  async deleteFile(filePath: string): Promise<void> {
    try {
      const fullPath = path.join(process.cwd(), 'uploads', filePath);
      if (fs.existsSync(fullPath)) {
        await fs.promises.unlink(fullPath);
      }
    } catch (error) {
      console.error('Failed to delete file:', error);
    }
  }
} 