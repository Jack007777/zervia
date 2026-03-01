import { ApiProperty } from '@nestjs/swagger';

export class AuthTokensDto {
  @ApiProperty()
  accessToken!: string;

  @ApiProperty()
  refreshToken!: string;
}

export class AuthResponseDto {
  @ApiProperty()
  userId!: string;

  @ApiProperty({ type: AuthTokensDto })
  tokens!: AuthTokensDto;
}
