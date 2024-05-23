import { readdirSync, readFileSync } from 'fs';
import * as path from 'path';
import { Test, TestingModule } from '@nestjs/testing';
import { DecisionsService } from './api/decisions/decisions.service';

describe('Test all rules', () => {
  let service: DecisionsService;

  const directoryPath = path.join(__dirname, '/rules');
  const files = readdirSync(directoryPath);

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DecisionsService],
    }).compile();
    service = module.get<DecisionsService>(DecisionsService);
  });

  files.forEach((file) => {
    if (path.extname(file) === '.json' && !file.includes('.tests.json')) {
      describe(`Testing ${file}`, () => {
        const testFile = file.replace('.json', '.tests.json');

        // TODO: Check if tests file does not exist
        const { tests } = JSON.parse(readFileSync(path.join(directoryPath, testFile), 'utf-8'));

        tests.forEach((test) => {
          // TODO: Check if test is not valid (missing name, input, or output)
          it(`Scenario: ${test?.name}`, async () => {
            const { result } = await service.runDecision(test.input);
            expect(result).toEqual(test.output);
          });
        });
      });
    }
  });
});
