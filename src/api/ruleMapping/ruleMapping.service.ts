import { Injectable } from '@nestjs/common';
import { Node, Edge, TraceObject, Field, RuleContent } from './ruleMapping.interface';
import { RuleSchema } from '../scenarioData/scenarioData.interface';

export class InvalidRuleContent extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidRuleContentError';
  }
}

@Injectable()
export class RuleMappingService {
  constructor() {}

  // Extract all fields from a list of nodes
  extractFields(nodes: Node[], fieldKey: 'inputs' | 'outputs'): { [key: string]: any[] } {
    const fields: any[] = nodes.flatMap((node: any) => {
      if (node.type === 'expressionNode' && node.content?.expressions) {
        return node.content.expressions.map((expr: { key: any; value: any }) => ({
          key: fieldKey === 'inputs' ? expr.key : expr.value,
          property: fieldKey === 'inputs' ? expr.value : expr.key,
        }));
      } else if (node.type === 'functionNode' && node?.content) {
        return (node.content.split('\n') || []).reduce((acc: any, line: string) => {
          const match = line.match(fieldKey === 'inputs' ? /\s*\*\s*@param\s+/ : /\s*\*\s*@returns\s+/);
          if (match) {
            const item = line.replace(match[0], '').trim();
            acc.push({
              key: item,
              property: item,
            });
          }
          return acc;
        }, []);
      } else {
        return (node.content?.[fieldKey] || []).map((field: Field) => ({
          id: field.id,
          name: field.name,
          type: field.type,
          property: field.field,
        }));
      }
    });
    return { [fieldKey]: fields };
  }

  // Get the final outputs of a rule from mapping the target output nodes and the edges
  extractResultOutputs(
    nodes: Node[],
    edges: Edge[],
  ): {
    resultOutputs: any[];
  } {
    // Find the output node
    const outputNode = nodes.find((obj) => obj.type === 'outputNode');

    if (!outputNode) {
      throw new Error('No outputNode found in the nodes array');
    }

    const outputNodeID = outputNode.id;

    // Find the edges that connect the output node to other nodes
    const targetEdges = edges.filter((edge) => edge.targetId === outputNodeID);
    const targetOutputNodes = targetEdges.map((edge) => nodes.find((node) => node.id === edge.sourceId));
    const resultOutputs: any[] = this.extractFields(targetOutputNodes, 'outputs').outputs;

    return { resultOutputs };
  }

  extractInputsAndOutputs(nodes: Node[]): {
    inputs: any[];
    outputs: any[];
  } {
    const inputs: any[] = this.extractFields(nodes, 'inputs').inputs;
    const outputs: any[] = this.extractFields(nodes, 'outputs').outputs;
    return { inputs, outputs };
  }

  // Find unique fields that are not present in another set of fields
  findUniqueFields(fields: any[], otherFields: Set<string>): { [key: string]: any } {
    const uniqueFields: { [key: string]: any } = {};
    fields.forEach((field) => {
      const fieldValue = field.property;
      if (!otherFields.has(fieldValue)) {
        uniqueFields[fieldValue] = field;
      }
    });
    return uniqueFields;
  }

  // extract only the unique inputs from a list of nodes
  // excludes inputs found in the outputs of other nodes
  extractUniqueInputs(nodes: Node[]) {
    const { inputs, outputs } = this.extractInputsAndOutputs(nodes);
    const outputFields = new Set(outputs.map((outputField) => outputField.property));
    const uniqueInputFields = this.findUniqueFields(inputs, outputFields);

    return {
      uniqueInputs: Object.values(uniqueInputFields),
    };
  }

  // generate a rule schema from a list of nodes that represent the origin inputs and all outputs of a rule
  ruleSchema(ruleContent: RuleContent): RuleSchema {
    if (!ruleContent) {
      throw new InvalidRuleContent('No content');
    }
    const { nodes, edges } = ruleContent;
    if (!nodes || !Array.isArray(nodes)) {
      throw new InvalidRuleContent('Rule has no nodes');
    }
    const inputs: any[] = this.extractUniqueInputs(nodes).uniqueInputs;
    const generalOutputs: any[] = this.extractFields(nodes, 'outputs').outputs;
    const resultOutputs: any[] = this.extractResultOutputs(nodes, edges).resultOutputs;

    //get unique outputs excluding final outputs
    const outputs: any[] = generalOutputs.filter(
      (output) =>
        !resultOutputs.some(
          (resultOutput) =>
            resultOutput.id === output.id ||
            (resultOutput.key === output.key && resultOutput.property === output.property),
        ),
    );

    return { inputs, outputs, resultOutputs };
  }

  // generate a schema for the inputs and outputs of a rule given the trace data of a rule run
  evaluateRuleSchema(trace: TraceObject): {
    input: any;
    output: any;
  } {
    const output: any = {};
    const input: any = {};
    for (const traceId in trace) {
      if (trace.hasOwnProperty(traceId)) {
        const traceData = trace[traceId];
        if (traceData.output !== null && traceData.output !== undefined) {
          Object.assign(output, traceData.output);
        }
        if (traceData.input !== null && traceData.input !== undefined) {
          Object.assign(input, traceData.input);
        }
      }
    }
    return { input, output };
  }
}
