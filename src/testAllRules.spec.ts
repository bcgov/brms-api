import { readdirSync, readFileSync, existsSync } from 'fs';
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
        const testFilePath = path.join(directoryPath, testFile);

        // Check if tests file does not exist
        if (!existsSync(testFilePath)) {
          console.warn(`Test file ${testFile} does not exist.`);
          return;
        }

        const { tests } = JSON.parse(readFileSync(testFilePath, 'utf-8'));

        tests.forEach((test: { name: string; input: object; output: object }, index) => {
          // Check if test is not valid (missing name, input, or output)
          if (!test.name || !test.input || !test.output) {
            console.warn(`Test at index ${index} in ${testFile} is invalid: ${JSON.stringify(test)}`);
            return;
          }

          it(`Scenario: ${test.name}`, async () => {
            const { result } = await service.runDecision(test.input);
            expect(result).toEqual(test.output);
          });
        });
      });
    }
  });
});
