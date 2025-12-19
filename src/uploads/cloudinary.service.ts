import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  constructor(private configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get<string>('cloudinary.cloudName'),
      api_key: this.configService.get<string>('cloudinary.apiKey'),
      api_secret: this.configService.get<string>('cloudinary.apiSecret'),
      secure: true,
    });
  }

  uploadImage(file: Express.Multer.File, folder = 'aura-commerce') {
    return new Promise<UploadApiResponse>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'image',
        },
        (error, result) => {
          if (error || !result) {
            const resolvedError =
              error instanceof Error
                ? error
                : new Error('Cloudinary upload failed');
            reject(resolvedError);
            return;
          }
          resolve(result);
        },
      );

      stream.end(file.buffer);
    });
  }
}
