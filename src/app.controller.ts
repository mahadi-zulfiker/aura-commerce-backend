import { Controller, Get, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(@Req() req: Request, @Res() res: Response) {
    if (typeof req.query.code === 'string') {
      const queryIndex = req.originalUrl.indexOf('?');
      const query = queryIndex >= 0 ? req.originalUrl.slice(queryIndex) : '';
      res.redirect(`/auth/google/callback${query}`);
      return;
    }

    res.send(this.appService.getHello());
  }
}
