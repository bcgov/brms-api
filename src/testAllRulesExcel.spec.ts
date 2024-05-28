import { Test, TestingModule } from '@nestjs/testing';
import { DecisionsService } from './api/decisions/decisions.service';
import xlsx from 'node-xlsx';

// Helper function to parse Excel data
const parseExcelFile = (filePath: string) => {
  const sheets = xlsx.parse(filePath);
  return sheets.map((sheet) => {
    const [header, inputOutputNames, ...rows] = sheet.data;
    const nameColumnIndex = header.indexOf('NAME');
    const inputColStart = header.indexOf('INPUTS');
    const outputColStart = header.indexOf('OUTPUTS');
    const inputColEnd = outputColStart - 1;
    const outputColEnd = inputOutputNames.length;

    const inputNames = inputOutputNames.slice(inputColStart, inputColEnd + 1);
    const outputNames = inputOutputNames.slice(outputColStart, outputColEnd);

    return {
      name: sheet.name,
      nameColumnIndex,
      inputNames,
      outputNames,
      rows,
      inputColStart,
      outputColStart,
    };
  });
};

// Load and parse the Excel file
const excelFilePath = `${__dirname}/InputOutputTest.xlsx`;
const excelSheets = parseExcelFile(excelFilePath);

describe('Test all excel rules', () => {
  let service: DecisionsService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DecisionsService],
    }).compile();
    service = module.get<DecisionsService>(DecisionsService);
  });

  // Iterate over each sheet in the Excel file
  excelSheets.forEach((sheet) => {
    describe(`Testing ${sheet.name}`, () => {
      sheet.rows.forEach((row, rowIndex) => {
        const scenarioName = row[sheet.nameColumnIndex];

        it(`Scenario: ${scenarioName}`, async () => {
          const input = sheet.inputNames.reduce((acc, inputName, index) => {
            acc[inputName] = row[sheet.inputColStart + index];
            return acc;
          }, {});

          const output = sheet.outputNames.reduce((acc, outputName, index) => {
            acc[outputName] = row[sheet.outputColStart + index];
            return acc;
          }, {});

          const { result } = await service.runDecision(input);
          expect(result).toEqual(output);
        });
      });
    });
  });
});
