import { Module } from '@nestjs/common';

import { CategoriesController, SpeakersController, TagsController } from './taxonomy.controller.js';
import { TaxonomyService } from './taxonomy.service.js';

@Module({
  controllers: [CategoriesController, SpeakersController, TagsController],
  providers: [TaxonomyService],
  exports: [TaxonomyService],
})
export class TaxonomyModule {}
