import { ApiProperty } from '@nestjs/swagger';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class AuthTokensDto {
  @ApiProperty()
  accessToken!: string;

  @ApiProperty()
  refreshToken!: string;
}

export class AuthResponseDto {
  @ApiPropertyOptional()
  userId?: string;

  @ApiPropertyOptional({ type: AuthTokensDto })
  tokens?: AuthTokensDto;

  @ApiPropertyOptional()
  verificationRequired?: boolean;

  @ApiPropertyOptional()
  channel?: 'email' | 'phone_manual';

  @ApiPropertyOptional()
  identifier?: string;
}
