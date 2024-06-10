import { Test, TestingModule } from '@nestjs/testing';
import { RuleMappingService } from './ruleMapping.service';
import { Node } from './ruleMapping.interface';
import { DocumentsService } from '../documents/documents.service';

describe('RuleMappingService', () => {
  let service: RuleMappingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RuleMappingService],
    }).compile();

    service = module.get<RuleMappingService>(RuleMappingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('extractInputs', () => {
    it('should extract inputs correctly', () => {
      const nodes: Node[] = [
        {
          type: 'someType',
          content: {
            inputs: [
              { id: '1', name: 'Input1', type: 'string', field: 'field1' },
              { id: '2', name: 'Input2', type: 'number', field: 'field2' },
            ],
            expressions: [{ key: 'expr1', value: 'field3' }],
          },
          id: 'testNode',
        },
        {
          type: 'expressionNode',
          content: {
            expressions: [{ key: 'expr1', value: 'field3' }],
          },
          id: 'testNode2',
        },
      ];

      const result = service.extractInputs(nodes);
      expect(result).toEqual({
        inputs: [
          { id: '1', name: 'Input1', type: 'string', property: 'field1' },
          { id: '2', name: 'Input2', type: 'number', property: 'field2' },
          { key: 'expr1', property: 'field3' },
        ],
      });
    });

    it('should handle empty nodes array', () => {
      const nodes: Node[] = [];
      const result = service.extractInputs(nodes);
      expect(result).toEqual({ inputs: [] });
    });
  });

  describe('extractOutputs', () => {
    it('should extract outputs correctly', () => {
      const nodes: Node[] = [
        {
          type: 'someType',
          content: {
            outputs: [
              { id: '1', name: 'Output1', type: 'string', field: 'field1' },
              { id: '2', name: 'Output2', type: 'number', field: 'field2' },
            ],
          },
          id: 'testNode',
        },
      ];

      const result = service.extractOutputs(nodes);
      expect(result).toEqual({
        outputs: [
          { id: '1', name: 'Output1', type: 'string', property: 'field1' },
          { id: '2', name: 'Output2', type: 'number', property: 'field2' },
        ],
      });
    });

    it('should handle empty nodes array', () => {
      const nodes: Node[] = [];
      const result = service.extractOutputs(nodes);
      expect(result).toEqual({ outputs: [] });
    });
  });

  describe('extractInputsAndOutputs', () => {
    it('should extract inputs and outputs correctly', () => {
      const nodes: Node[] = [
        {
          type: 'someType',
          content: {
            inputs: [
              { id: '1', name: 'Input1', type: 'string', field: 'field1' },
              { id: '2', name: 'Input2', type: 'number', field: 'field2' },
            ],
            outputs: [
              { id: '3', name: 'Output1', type: 'string', field: 'field3' },
              { id: '4', name: 'Output2', type: 'number', field: 'field4' },
            ],
          },
          id: 'testNode',
        },
        {
          type: 'expressionNode',
          content: {
            expressions: [{ key: 'expr1', value: 'field5' }],
          },
          id: 'testNode2',
        },
      ];

      const result = service.extractInputsAndOutputs(nodes);
      expect(result).toEqual({
        inputs: [
          { id: '1', name: 'Input1', type: 'string', property: 'field1' },
          { id: '2', name: 'Input2', type: 'number', property: 'field2' },
          { key: 'expr1', property: 'field5' },
        ],
        outputs: [
          { id: '3', name: 'Output1', type: 'string', property: 'field3' },
          { id: '4', name: 'Output2', type: 'number', property: 'field4' },
          { key: 'field5', property: 'expr1' },
        ],
      });
    });

    it('should handle empty nodes array', () => {
      const nodes: Node[] = [];
      const result = service.extractInputsAndOutputs(nodes);
      expect(result).toEqual({ inputs: [], outputs: [] });
    });
  });
  describe('findUniqueFields', () => {
    it('should find unique fields', () => {
      const fields = [
        { property: 'field1', name: 'Field 1' },
        { property: 'field2', name: 'Field 2' },
      ];
      const otherFields = new Set(['field2']);
      const result = service.findUniqueFields(fields, otherFields);
      expect(result).toEqual({
        field1: { property: 'field1', name: 'Field 1' },
      });
    });
  });

  describe('extractUniqueInputs', () => {
    it('should extract unique inputs correctly', () => {
      const nodes: Node[] = [
        {
          type: 'someType',
          content: {
            inputs: [
              { id: '1', name: 'Input1', type: 'string', field: 'field1' },
              { id: '2', name: 'Input2', type: 'number', field: 'field2' },
            ],
            outputs: [{ id: '3', name: 'Output1', type: 'string', field: 'field2' }],
          },
          id: 'testNode',
        },
      ];

      const result = service.extractUniqueInputs(nodes);
      expect(result).toEqual({
        uniqueInputs: [{ id: '1', name: 'Input1', type: 'string', property: 'field1' }],
      });
    });

    it('should handle nodes without inputs', () => {
      const nodes: Node[] = [
        {
          type: 'someType',
          content: {
            outputs: [{ id: '3', name: 'Output1', type: 'string', field: 'field2' }],
          },
          id: 'testNode',
        },
      ];

      const result = service.extractUniqueInputs(nodes);
      expect(result).toEqual({
        uniqueInputs: [],
      });
    });
  });

  describe('ruleSchema', () => {
    it('should generate a rule schema correctly', () => {
      const nodes: Node[] = [
        {
          id: '1',
          type: 'inputNode', // Assuming this node is an input node
          content: {
            inputs: [
              { id: '1', name: 'Input1', type: 'string', field: 'field1' },
              { id: '2', name: 'Input2', type: 'number', field: 'field2' },
            ],
          },
        },
        {
          id: '2',
          type: 'outputNode', // This node is the output node
          content: {
            outputs: [
              { id: '1', name: 'Output1', type: 'string', field: 'field2' },
              { id: '2', name: 'Output2', type: 'number', field: 'field3' },
            ],
          },
        },
      ];

      const edges = [{ id: '1', type: 'someType', targetId: '2', sourceId: '1' }]; // Edge connects input node to output node

      const result = service.ruleSchema(nodes, edges);
      expect(result).toEqual({
        inputs: [{ id: '1', name: 'Input1', type: 'string', property: 'field1' }],
        outputs: [
          { id: '1', name: 'Output1', type: 'string', property: 'field2' },
          { id: '2', name: 'Output2', type: 'number', property: 'field3' },
        ],
        finalOutputs: [],
      });
    });
  });

  describe('ruleSchemaFile', () => {
    it('should generate a rule schema from a file', async () => {
      const mockFileContent = JSON.stringify({
        nodes: [
          {
            id: '1',
            type: 'inputNode', // Assuming this node is an input node
            content: {
              inputs: [
                { id: '1', name: 'Input1', type: 'string', field: 'field1' },
                { id: '2', name: 'Input2', type: 'number', field: 'field2' },
              ],
            },
          },
          {
            id: '2',
            type: 'outputNode', // This node is the output node
            content: {
              outputs: [
                { id: '3', name: 'Output1', type: 'string', field: 'field2' },
                { id: '4', name: 'Output2', type: 'number', field: 'field3' },
              ],
            },
          },
        ],
        edges: [
          {
            id: '1',
            type: 'someType',
            targetId: '2',
            sourceId: '1',
          },
        ],
      });

      const mockGetFileContent = jest.fn().mockResolvedValue(mockFileContent);
      DocumentsService.prototype.getFileContent = mockGetFileContent;

      const filePath = 'path/to/mock/file.json';
      const result = await service.ruleSchemaFile(filePath);

      expect(mockGetFileContent).toHaveBeenCalledWith(filePath);
      expect(result).toEqual({
        finalOutputs: [],
        inputs: [{ id: '1', name: 'Input1', type: 'string', property: 'field1' }],
        outputs: [
          { id: '3', name: 'Output1', type: 'string', property: 'field2' },
          { id: '4', name: 'Output2', type: 'number', property: 'field3' },
        ],
      });
    });
  });
});
