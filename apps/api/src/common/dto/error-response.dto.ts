import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ErrorResponseDto {
  @ApiProperty({ example: 'AUTH_INVALID_CREDENTIALS' })
  errorCode!: string;

  @ApiProperty({ example: 'Invalid email or password' })
  message!: string;

  @ApiPropertyOptional({
    example: {
      field: 'email'
    }
  })
  details?: unknown;
}
