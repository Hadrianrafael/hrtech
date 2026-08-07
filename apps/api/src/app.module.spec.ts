import { Test } from '@nestjs/testing';
import { describe, it, expect } from 'vitest';
import { AppModule } from './app.module';

describe('AppModule', () => {
  it('compiles the full dependency graph', async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    expect(moduleRef).toBeDefined();
  });
});
