import { Injectable, BadRequestException } from '@nestjs/common';
import * as sharp from 'sharp';
import * as fs from 'fs';
import * as path from 'path';
import { UPLOAD_CONFIG } from '../config/upload.config';

@Injectable()
export class UploadService {
    async processAndSaveThumbnail(file: Express.Multer.File): Promise<string> {
        try {
            const { dimensions, quality, path: uploadPath } = UPLOAD_CONFIG.thumbnail;

            // Tạo buffer từ file upload
            const processedImage = await sharp(file.buffer)
                .resize(dimensions.width, dimensions.height, {
                    fit: dimensions.fit,
                    position: 'center',
                })
                .jpeg({ quality })
                .toBuffer();

            // Tạo tên file duy nhất
            const fileName = `${Date.now()}-${Math.round(Math.random() * 1E6)}.jpg`;

            // Tạo đường dẫn đầy đủ
            const uploadDir = path.join(process.cwd(), 'uploads', uploadPath);
            const filePath = path.join(uploadDir, fileName);

            // Đảm bảo thư mục tồn tại
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            // Lưu file
            await fs.promises.writeFile(filePath, processedImage);

            // Trả về đường dẫn relative để lưu vào database
            return path.join(uploadPath, fileName).replace(/\\/g, '/');
        } catch (error) {
            console.error('Error in processAndSaveThumbnail:', error);
            throw new BadRequestException('Failed to process thumbnail image');
        }
    }

    async processAndSaveSliderImages(files: Express.Multer.File[]): Promise<string[]> {
        try {
            const { dimensions, quality, path: uploadPath } = UPLOAD_CONFIG.slider;
            const processedPaths: string[] = [];

            // Tạo thư mục nếu chưa tồn tại
            const uploadDir = path.join(process.cwd(), 'uploads', uploadPath);
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            for (const file of files) {
                // Xử lý từng file
                const processedImage = await sharp(file.buffer)
                    .resize(dimensions.width, dimensions.height, {
                        fit: dimensions.fit,
                        position: 'center',
                    })
                    .jpeg({ quality })
                    .toBuffer();

                // Tạo tên file duy nhất
                const fileName = `${Date.now()}-${Math.round(Math.random() * 1E6)}.jpg`;
                const filePath = path.join(uploadDir, fileName);

                // Lưu file
                await fs.promises.writeFile(filePath, processedImage);

                // Thêm đường dẫn vào mảng kết quả
                processedPaths.push(path.join(uploadPath, fileName).replace(/\\/g, '/'));
            }

            return processedPaths;
        } catch (error) {
            console.error('Error in processAndSaveSliderImages:', error);
            throw new BadRequestException('Failed to process slider images');
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

    // Phương thức xóa nhiều file
    async deleteFiles(filePaths: string[]): Promise<void> {
        await Promise.all(
            filePaths.map(filePath => this.deleteFile(filePath))
        );
    }
} 