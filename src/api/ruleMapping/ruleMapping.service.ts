import { Injectable } from '@nestjs/common';
import { Node, Edge, TraceObject, Field } from './ruleMapping.interface';
import { DocumentsService } from '../documents/documents.service';

@Injectable()
export class RuleMappingService {
  constructor(private documentsService: DocumentsService) {}
  // Extract all fields from a list of nodes
  extractFields(nodes: Node[], fieldKey: 'inputs' | 'outputs'): { [key: string]: any[] } {
    const fields: any[] = nodes.flatMap((node: any) => {
      if (node.type === 'expressionNode' && node.content?.expressions) {
        return node.content.expressions.map((expr: { key: any; value: any }) => ({
          key: fieldKey === 'inputs' ? expr.key : expr.value,
          property: fieldKey === 'inputs' ? expr.value : expr.key,
        }));
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
  extractfinalOutputs(
    nodes: Node[],
    edges: Edge[],
  ): {
    finalOutputs: any[];
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
    const finalOutputs: any[] = this.extractFields(targetOutputNodes, 'outputs').outputs;

    return { finalOutputs };
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
  ruleSchema(
    nodes: Node[],
    edges: Edge[],
  ): {
    inputs: any[];
    outputs: any[];
    finalOutputs: any[];
  } {
    const inputs: any[] = this.extractUniqueInputs(nodes).uniqueInputs;
    const generalOutputs: any[] = this.extractFields(nodes, 'outputs').outputs;
    const finalOutputs: any[] = this.extractfinalOutputs(nodes, edges).finalOutputs;

    //get unique outputs excluding final outputs
    const outputs: any[] = generalOutputs.filter(
      (output) =>
        !finalOutputs.some(
          (finalOutput) =>
            finalOutput.id === output.id ||
            (finalOutput.key === output.key && finalOutput.property === output.property),
        ),
    );

    return { inputs, outputs, finalOutputs };
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

  // generate a rule schema from a given local file
  async ruleSchemaFile(filePath: string): Promise<any> {
    const fileContent = await this.documentsService.getFileContent(filePath);
    const { nodes, edges } = await JSON.parse(fileContent.toString());
    return this.ruleSchema(nodes, edges);
  }
}
