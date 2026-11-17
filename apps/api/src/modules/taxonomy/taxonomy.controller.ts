import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  categoryInputSchema,
  speakerInputSchema,
  tagMergeSchema,
  tagRenameSchema,
  type CategoryInput,
  type SpeakerInput,
  type TagMergeInput,
  type TagRenameInput,
} from '@webdakwah/shared';

import { CurrentProfile, Public, Roles } from '../auth/auth.decorators.js';
import type { AuthProfile } from '../auth/auth.types.js';
import { TaxonomyService } from './taxonomy.service.js';

function parseCategory(body: unknown): CategoryInput {
  const parsed = categoryInputSchema.safeParse(body);

  if (!parsed.success) {
    throw new BadRequestException(parsed.error.issues.map((issue) => issue.message));
  }

  return parsed.data;
}

function parseSpeaker(body: unknown): SpeakerInput {
  const parsed = speakerInputSchema.safeParse(body);

  if (!parsed.success) {
    throw new BadRequestException(parsed.error.issues.map((issue) => issue.message));
  }

  return parsed.data;
}

function parseTagRename(body: unknown): TagRenameInput {
  const parsed = tagRenameSchema.safeParse(body);

  if (!parsed.success) {
    throw new BadRequestException(parsed.error.issues.map((issue) => issue.message));
  }

  return parsed.data;
}

function parseTagMerge(body: unknown): TagMergeInput {
  const parsed = tagMergeSchema.safeParse(body);

  if (!parsed.success) {
    throw new BadRequestException(parsed.error.issues.map((issue) => issue.message));
  }

  return parsed.data;
}

@Controller('categories')
export class CategoriesController {
  constructor(private readonly taxonomy: TaxonomyService) {}

  /** Daftar kategori yang punya konten terbit; dipakai halaman publik. */
  @Get()
  @Public()
  listPublic() {
    return this.taxonomy.listPublicCategories();
  }

  @Get('options')
  listOptions() {
    return this.taxonomy.listCategoryOptions();
  }

  @Get('manage')
  @Roles('ADMIN')
  listManaged(@CurrentProfile() profile: AuthProfile) {
    this.taxonomy.assertManager(profile);

    return this.taxonomy.listCategories();
  }

  @Post()
  @Roles('ADMIN')
  create(@CurrentProfile() profile: AuthProfile, @Body() body: unknown) {
    this.taxonomy.assertManager(profile);

    return this.taxonomy.createCategory(parseCategory(body));
  }

  @Patch(':id')
  @Roles('ADMIN')
  update(
    @CurrentProfile() profile: AuthProfile,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: unknown,
  ) {
    this.taxonomy.assertManager(profile);

    return this.taxonomy.updateCategory(id, parseCategory(body));
  }

  @Delete(':id')
  @Roles('ADMIN')
  remove(@CurrentProfile() profile: AuthProfile, @Param('id', ParseUUIDPipe) id: string) {
    this.taxonomy.assertManager(profile);

    return this.taxonomy.deleteCategory(id);
  }
}

@Controller('speakers')
export class SpeakersController {
  constructor(private readonly taxonomy: TaxonomyService) {}

  /** Daftar penceramah yang punya konten terbit; dipakai halaman publik. */
  @Get()
  @Public()
  listPublic() {
    return this.taxonomy.listPublicSpeakers();
  }

  @Get('options')
  listOptions() {
    return this.taxonomy.listSpeakerOptions();
  }

  @Get('manage')
  @Roles('ADMIN')
  listManaged(@CurrentProfile() profile: AuthProfile) {
    this.taxonomy.assertManager(profile);

    return this.taxonomy.listSpeakers();
  }

  @Post()
  @Roles('ADMIN')
  create(@CurrentProfile() profile: AuthProfile, @Body() body: unknown) {
    this.taxonomy.assertManager(profile);

    return this.taxonomy.createSpeaker(parseSpeaker(body));
  }

  @Patch(':id')
  @Roles('ADMIN')
  update(
    @CurrentProfile() profile: AuthProfile,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: unknown,
  ) {
    this.taxonomy.assertManager(profile);

    return this.taxonomy.updateSpeaker(id, parseSpeaker(body));
  }

  @Delete(':id')
  @Roles('ADMIN')
  remove(@CurrentProfile() profile: AuthProfile, @Param('id', ParseUUIDPipe) id: string) {
    this.taxonomy.assertManager(profile);

    return this.taxonomy.deleteSpeaker(id);
  }
}

@Controller('tags')
export class TagsController {
  constructor(private readonly taxonomy: TaxonomyService) {}

  /** Daftar tag yang punya konten terbit; dipakai halaman publik. */
  @Get()
  @Public()
  listPublic() {
    return this.taxonomy.listPublicTags();
  }

  @Get('manage')
  @Roles('ADMIN')
  listManaged(@CurrentProfile() profile: AuthProfile) {
    this.taxonomy.assertManager(profile);

    return this.taxonomy.listTags();
  }

  @Patch(':id')
  @Roles('ADMIN')
  rename(
    @CurrentProfile() profile: AuthProfile,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: unknown,
  ) {
    this.taxonomy.assertManager(profile);

    return this.taxonomy.renameTag(id, parseTagRename(body));
  }

  @Post(':id/merge')
  @Roles('ADMIN')
  merge(
    @CurrentProfile() profile: AuthProfile,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: unknown,
  ) {
    this.taxonomy.assertManager(profile);

    const input = parseTagMerge(body);

    return this.taxonomy.mergeTag(id, input.targetId);
  }

  @Delete(':id')
  @Roles('ADMIN')
  remove(@CurrentProfile() profile: AuthProfile, @Param('id', ParseUUIDPipe) id: string) {
    this.taxonomy.assertManager(profile);

    return this.taxonomy.deleteTag(id);
  }
}
