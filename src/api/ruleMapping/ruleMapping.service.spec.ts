import { Test, TestingModule } from '@nestjs/testing';
import { RuleMappingService, InvalidRuleContent } from './ruleMapping.service';
import { Node, TraceObject, Edge, RuleContent } from './ruleMapping.interface';
import { DocumentsService } from '../documents/documents.service';
import { ConfigService } from '@nestjs/config';

describe('RuleMappingService', () => {
  let service: RuleMappingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RuleMappingService,
        DocumentsService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('mocked_value'), // Replace with your mocked config values
          },
        },
      ],
    }).compile();

    service = module.get<RuleMappingService>(RuleMappingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('extractFields', () => {
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

      const result = service.extractFields(nodes, 'inputs');
      expect(result).toEqual({
        inputs: [
          { id: '1', name: 'Input1', type: 'string', property: 'field1' },
          { id: '2', name: 'Input2', type: 'number', property: 'field2' },
          { key: 'expr1', property: 'field3' },
        ],
      });
    });

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

      const result = service.extractFields(nodes, 'outputs');
      expect(result).toEqual({
        outputs: [
          { id: '1', name: 'Output1', type: 'string', property: 'field1' },
          { id: '2', name: 'Output2', type: 'number', property: 'field2' },
        ],
      });
    });

    it('should handle empty nodes array', () => {
      const nodes: Node[] = [];
      const result = service.extractFields(nodes, 'outputs');
      expect(result).toEqual({ outputs: [] });
    });
  });

  describe('extractResultOutputs', () => {
    it('should extract result outputs correctly when there is one output node and corresponding edges', () => {
      const nodes: Node[] = [
        {
          id: '1',
          type: 'inputNode',
          content: {
            inputs: [{ id: '1', name: 'Input1', type: 'string', field: 'field1' }],
          },
        },
        {
          id: '2',
          type: 'outputNode',
          content: {
            outputs: [{ id: '1', name: 'Output1', type: 'string', field: 'field2' }],
          },
        },
        {
          id: '3',
          type: 'intermediateNode',
          content: {
            outputs: [{ id: '2', name: 'Output2', type: 'number', field: 'field3' }],
          },
        },
      ];

      const edges: Edge[] = [
        { id: '1', type: 'someType', sourceId: '1', targetId: '2' },
        { id: '2', type: 'someType', sourceId: '3', targetId: '2' },
      ];

      jest.spyOn(service, 'extractFields').mockReturnValue({
        outputs: [
          { id: '1', name: 'Output1', type: 'string', property: 'field2' },
          { id: '2', name: 'Output2', type: 'number', property: 'field3' },
        ],
      });

      const result = service.extractResultOutputs(nodes, edges);
      expect(result).toEqual({
        resultOutputs: [
          { id: '1', name: 'Output1', type: 'string', property: 'field2' },
          { id: '2', name: 'Output2', type: 'number', property: 'field3' },
        ],
      });
    });

    it('should throw an error if no outputNode is found', () => {
      const nodes: Node[] = [
        {
          id: '1',
          type: 'inputNode',
          content: {
            inputs: [{ id: '1', name: 'Input1', type: 'string', field: 'field1' }],
          },
        },
      ];

      const edges: Edge[] = [{ id: '1', type: 'someType', sourceId: '1', targetId: '2' }];

      expect(() => service.extractResultOutputs(nodes, edges)).toThrow('No outputNode found in the nodes array');
    });

    it('should return an empty array if no target edges are found for the output node', () => {
      const nodes: Node[] = [
        {
          id: '1',
          type: 'inputNode',
          content: {
            inputs: [{ id: '1', name: 'Input1', type: 'string', field: 'field1' }],
          },
        },
        {
          id: '2',
          type: 'outputNode',
          content: {
            outputs: [{ id: '1', name: 'Output1', type: 'string', field: 'field2' }],
          },
        },
      ];

      const edges: Edge[] = [];

      jest.spyOn(service, 'extractFields').mockReturnValue({
        outputs: [],
      });

      const result = service.extractResultOutputs(nodes, edges);
      expect(result).toEqual({
        resultOutputs: [],
      });
    });

    it('should handle cases where there are multiple output nodes', () => {
      const nodes: Node[] = [
        {
          id: '1',
          type: 'inputNode',
          content: {
            inputs: [{ id: '1', name: 'Input1', type: 'string', field: 'field1' }],
          },
        },
        {
          id: '2',
          type: 'outputNode',
          content: {
            outputs: [{ id: '1', name: 'Output1', type: 'string', field: 'field2' }],
          },
        },
        {
          id: '3',
          type: 'outputNode',
          content: {
            outputs: [{ id: '2', name: 'Output2', type: 'number', field: 'field3' }],
          },
        },
      ];

      const edges: Edge[] = [
        { id: '1', type: 'someType', sourceId: '1', targetId: '2' },
        { id: '2', type: 'someType', sourceId: '1', targetId: '3' },
      ];

      jest.spyOn(service, 'extractFields').mockReturnValue({
        outputs: [
          { id: '1', name: 'Output1', type: 'string', property: 'field2' },
          { id: '2', name: 'Output2', type: 'number', property: 'field3' },
        ],
      });

      const result = service.extractResultOutputs(nodes, edges);
      expect(result).toEqual({
        resultOutputs: [
          { id: '1', name: 'Output1', type: 'string', property: 'field2' },
          { id: '2', name: 'Output2', type: 'number', property: 'field3' },
        ],
      });
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

      const result = service.ruleSchema({ nodes, edges });
      expect(result).toEqual({
        inputs: [{ id: '1', name: 'Input1', type: 'string', property: 'field1' }],
        outputs: [
          { id: '1', name: 'Output1', type: 'string', property: 'field2' },
          { id: '2', name: 'Output2', type: 'number', property: 'field3' },
        ],
        resultOutputs: [],
      });
    });

    it('should handle invalid request data', async () => {
      const ruleContent = { nodes: 'invalid' } as unknown as RuleContent;
      expect(() => service.ruleSchema(ruleContent)).toThrow(new InvalidRuleContent('Rule has no nodes'));
    });
  });

  describe('evaluateRuleSchema', () => {
    it('should generate a rule schema correctly with single input and output', () => {
      const trace: TraceObject = {
        '1': {
          id: '1',
          name: 'Test Rule',
          input: { field1: 'value1', field2: 'value2' },
          output: { outputField1: 'outputValue1' },
        },
      };

      const result = service.evaluateRuleSchema(trace);
      expect(result).toEqual({
        input: { field1: 'value1', field2: 'value2' },
        output: { outputField1: 'outputValue1' },
      });
    });

    it('should generate a rule schema correctly with multiple nested objects', () => {
      const trace: TraceObject = {
        '1': {
          id: '1',
          name: 'Test Rule 1',
          input: { field1: 'value1', field2: 'value2' },
          output: { outputField1: 'outputValue1' },
        },
        '2': {
          id: '2',
          name: 'Test Rule 2',
          input: { field3: 'value3', field4: 'value4' },
          output: { outputField2: 'outputValue2' },
        },
        '3': {
          id: '3',
          name: 'Test Rule 3',
          input: { field5: 'value5' },
          output: { outputField3: 'outputValue3' },
        },
      };

      const result = service.evaluateRuleSchema(trace);
      expect(result).toEqual({
        input: {
          field1: 'value1',
          field2: 'value2',
          field3: 'value3',
          field4: 'value4',
          field5: 'value5',
        },
        output: {
          outputField1: 'outputValue1',
          outputField2: 'outputValue2',
          outputField3: 'outputValue3',
        },
      });
    });

    it('should handle cases where there is no input', () => {
      const trace: TraceObject = {
        '1': {
          id: '1',
          name: 'Test Rule',
          input: null,
          output: { outputField1: 'outputValue1' },
        },
      };

      const result = service.evaluateRuleSchema(trace);
      expect(result).toEqual({
        input: {},
        output: { outputField1: 'outputValue1' },
      });
    });

    it('should handle cases where there is no output', () => {
      const trace: TraceObject = {
        '1': {
          id: '1',
          name: 'Test Rule',
          input: { field1: 'value1', field2: 'value2' },
          output: null,
        },
      };

      const result = service.evaluateRuleSchema(trace);
      expect(result).toEqual({
        input: { field1: 'value1', field2: 'value2' },
        output: {},
      });
    });

    it('should handle cases where there are no inputs and outputs', () => {
      const trace: TraceObject = {
        '1': {
          id: '1',
          name: 'Test Rule',
          input: null,
          output: null,
        },
      };

      const result = service.evaluateRuleSchema(trace);
      expect(result).toEqual({
        input: {},
        output: {},
      });
    });
  });
});
