import { IsRequestId } from '@decorators/validation.decorator';
import { ApiProperty } from '@nestjs/swagger';
import { v4 } from 'uuid';

export class BaseAPIEntity {
  @IsRequestId()
  @ApiProperty({
    example: v4(),
    format: 'uuid',
    required: false,
  })
  readonly requestId?: string;
}
