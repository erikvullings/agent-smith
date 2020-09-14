import {Get, Controller, Res, Post} from '@nestjs/common';
import { Response } from 'express';

@Controller()
export class AppController {
  @Get()
  root(@Res() res:Response): void {
    res.redirect('/dashboard');
  }
  @Get('version')
  version(): string {
    return 'v0.0.1';
  }

  
 
}
