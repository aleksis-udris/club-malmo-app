import { Module } from '@nestjs/common'
import { ContentService } from './content.service'
import { ContentController } from './content.controller'
import { SportradarModule } from '../sportradar/sportradar.module'

@Module({
  imports: [SportradarModule],
  controllers: [ContentController],
  providers: [ContentService],
})
export class ContentModule {}
