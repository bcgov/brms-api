import 'reflect-metadata';

import {
  EdgeClass,
  TraceObjectEntryClass,
  TraceObjectClass,
  EvaluateRuleMappingDto,
  EvaluateRuleRunSchemaDto,
} from './evaluate-rulemapping.dto';

describe('DTO Classes', () => {
  describe('EdgeClass', () => {
    it('should create an edge with all properties', () => {
      const edge = new EdgeClass('edge1', 'default', 'target1', 'source1', 'sourceHandle1', 'targetHandle1');

      expect(edge).toEqual({
        id: 'edge1',
        type: 'default',
        targetId: 'target1',
        sourceId: 'source1',
        sourceHandle: 'sourceHandle1',
        targetHandle: 'targetHandle1',
      });
    });

    it('should create an edge without optional properties', () => {
      const edge = new EdgeClass('edge1', 'default', 'target1', 'source1');

      expect(edge).toEqual({
        id: 'edge1',
        type: 'default',
        targetId: 'target1',
        sourceId: 'source1',
        sourceHandle: undefined,
        targetHandle: undefined,
      });
    });
  });

  describe('TraceObjectEntryClass', () => {
    it('should create a trace entry with all properties', () => {
      const traceEntry = new TraceObjectEntryClass(
        'trace1',
        'Test Trace',
        { input: 'data' },
        { output: 'data' },
        '100ms',
        { extra: 'data' },
      );

      expect(traceEntry).toEqual({
        id: 'trace1',
        name: 'Test Trace',
        input: { input: 'data' },
        output: { output: 'data' },
        performance: '100ms',
        traceData: { extra: 'data' },
      });
    });

    it('should create a trace entry without optional properties', () => {
      const traceEntry = new TraceObjectEntryClass('trace1', 'Test Trace', { input: 'data' }, { output: 'data' });

      expect(traceEntry).toEqual({
        id: 'trace1',
        name: 'Test Trace',
        input: { input: 'data' },
        output: { output: 'data' },
        performance: undefined,
        traceData: undefined,
      });
    });
  });

  describe('TraceObjectClass', () => {
    it('should create a trace object with entries', () => {
      const entries = {
        trace1: new TraceObjectEntryClass('trace1', 'Test Trace 1', { input: 'data1' }, { output: 'data1' }),
        trace2: new TraceObjectEntryClass('trace2', 'Test Trace 2', { input: 'data2' }, { output: 'data2' }),
      };

      const traceObject = new TraceObjectClass(entries);

      expect(traceObject.trace1).toBeDefined();
      expect(traceObject.trace2).toBeDefined();
      expect(traceObject.trace1.id).toBe('trace1');
      expect(traceObject.trace2.id).toBe('trace2');
    });

    it('should create an empty trace object', () => {
      const traceObject = new TraceObjectClass({});
      expect(Object.keys(traceObject)).toHaveLength(0);
    });
  });

  describe('EvaluateRuleMappingDto', () => {
    it('should create instance with nodes and edges', () => {
      const dto = new EvaluateRuleMappingDto();
      dto.nodes = [{ id: 'node1', type: 'default', content: {} }];
      dto.edges = [new EdgeClass('edge1', 'default', 'target1', 'source1')];

      expect(dto.nodes).toHaveLength(1);
      expect(dto.edges).toHaveLength(1);
      expect(dto.nodes[0].id).toBe('node1');
      expect(dto.edges[0].id).toBe('edge1');
    });

    it('should create empty instance', () => {
      const dto = new EvaluateRuleMappingDto();
      expect(dto.nodes).toBeUndefined();
      expect(dto.edges).toBeUndefined();
    });
  });

  describe('EvaluateRuleRunSchemaDto', () => {
    it('should create instance with trace', () => {
      const dto = new EvaluateRuleRunSchemaDto();
      const traceEntries = {
        trace1: new TraceObjectEntryClass('trace1', 'Test Trace', { input: 'data' }, { output: 'data' }),
      };
      dto.trace = new TraceObjectClass(traceEntries);

      expect(dto.trace).toBeDefined();
      expect(dto.trace['trace1'].id).toBe('trace1');
    });

    it('should create empty instance', () => {
      const dto = new EvaluateRuleRunSchemaDto();
      expect(dto.trace).toBeUndefined();
    });
  });
});
