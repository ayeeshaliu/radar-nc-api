import { Body, JsonController, Post } from 'routing-controllers';
import { Inject, Service } from 'typedi';

import { AuthService } from './auth.service';
import { UserLoginDto } from './dto';
import { LoginResponse } from './types';

@Service()
@JsonController('/auth')
export class AuthController {
  constructor(@Inject() private readonly authService: AuthService) {}

  @Post('/login')
  async login(@Body() loginDto: UserLoginDto): Promise<LoginResponse> {
    return this.authService.login(loginDto.username, loginDto.password);
  }
}
