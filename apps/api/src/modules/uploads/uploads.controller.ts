import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { uploadRequestSchema, type UploadRequest } from '@webdakwah/shared';

import { CurrentProfile } from '../auth/auth.decorators.js';
import type { AuthProfile } from '../auth/auth.types.js';
import { UploadsService } from './uploads.service.js';

function parseInput(body: unknown): UploadRequest {
  const parsed = uploadRequestSchema.safeParse(body);

  if (!parsed.success) {
    throw new BadRequestException(parsed.error.issues.map((issue) => issue.message));
  }

  return parsed.data;
}

@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploads: UploadsService) {}

  @Post('presign')
  presign(@CurrentProfile() profile: AuthProfile, @Body() body: unknown) {
    return this.uploads.createPresignedUpload(profile, parseInput(body));
  }
}
