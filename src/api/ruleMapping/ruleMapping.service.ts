import { Injectable } from '@nestjs/common';
import { Node, Edge, TraceObject, Field, RuleContent } from './ruleMapping.interface';
import { DocumentsService } from '../documents/documents.service';
import { ConfigService } from '@nestjs/config';
import { RuleSchema } from '../scenarioData/scenarioData.interface';

export class InvalidRuleContent extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidRuleContentError';
  }
}

@Injectable()
export class RuleMappingService {
  rulesDirectory: string;
  constructor(
    private documentsService: DocumentsService,
    private configService: ConfigService,
  ) {
    this.rulesDirectory = this.configService.get<string>('RULES_DIRECTORY');
  }

  // Extract all fields from a list of nodes
  async extractFields(nodes: Node[], fieldKey: 'inputs' | 'outputs'): Promise<{ [key: string]: any[] }> {
    const promises = nodes.map(async (node: any) => {
      if (node.type === 'decisionNode' && node.content?.key) {
        const generateNestedSchema = await this.ruleSchemaFile(node.content.key);
        const { inputs, resultOutputs } = generateNestedSchema;
        return fieldKey === 'inputs' ? inputs : resultOutputs;
      }
      if (node.type === 'expressionNode' && node.content?.expressions) {
        const simpleExpressionRegex = /^[a-zA-Z0-9]+$/;
        return node.content.expressions.map((expr: { key: any; value: any }) => {
          const isSimpleValue = simpleExpressionRegex.test(expr.value);
          return {
            key: isSimpleValue ? (fieldKey === 'inputs' ? expr.key : expr.value) : expr.key,
            property: isSimpleValue ? (fieldKey === 'inputs' ? expr.value : expr.key) : expr.key,
            exception: isSimpleValue ? null : expr.value,
          };
        });
      } else if (node.type === 'functionNode' && node?.content) {
        if (node.content.source) {
          if (node.content.source.length > 10000) {
            throw new Error('Input too large');
          }
          return (node.content.source.split('\n') || []).reduce((acc: any[], line: string) => {
            const keyword = fieldKey === 'inputs' ? '@param' : '@returns';
            if (line.includes(keyword)) {
              const item = line.split(keyword)[1]?.trim();
              if (item) {
                acc.push({
                  key: item,
                  property: item,
                });
              }
            }
            return acc;
          }, []);
        } else {
          if (node.content.length > 10000) {
            throw new Error('Input too large');
          }
          return (node.content.split('\n') || []).reduce((acc: any[], line: string) => {
            const keyword = fieldKey === 'inputs' ? '@param' : '@returns';
            if (line.includes(keyword)) {
              const item = line.split(keyword)[1]?.trim();
              if (item) {
                acc.push({
                  key: item,
                  property: item,
                });
              }
            }
            return acc;
          }, []);
        }
      } else {
        return (node.content?.[fieldKey] || []).map((field: Field) => ({
          id: field.id,
          name: field.name,
          type: field.type,
          property: field.field,
        }));
      }
    });

    const results = await Promise.all(promises);
    const fields = results.flat();

    const uniqueFieldsMap = new Map(fields.map((field) => [field.property, field]));

    const uniqueFields = Array.from(uniqueFieldsMap.values());
    return { [fieldKey]: uniqueFields };
  }

  // Get the final outputs of a rule from mapping the target output nodes and the edges
  async extractResultOutputs(nodes: Node[], edges: Edge[]): Promise<{ resultOutputs: any[] }> {
    // Find the output node
    const outputNode = nodes.find((obj) => obj.type === 'outputNode');

    if (!outputNode) {
      throw new Error('No outputNode found in the nodes array');
    }

    const outputNodeID = outputNode.id;

    // Find the edges that connect the output node to other nodes
    const targetEdges = edges.filter((edge) => edge.targetId === outputNodeID);
    const targetOutputNodes = targetEdges.map((edge) => nodes.find((node) => node.id === edge.sourceId));
    const resultOutputs: any[] = (await this.extractFields(targetOutputNodes, 'outputs')).outputs;

    return { resultOutputs };
  }

  async extractInputsAndOutputs(nodes: Node[]): Promise<{ inputs: any[]; outputs: any[] }> {
    const inputs: any[] = (await this.extractFields(nodes, 'inputs')).inputs;
    const outputs: any[] = (await this.extractFields(nodes, 'outputs')).outputs;

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
  // inputs that are only transformed are still included as unique as marked as exception
  async extractUniqueInputs(nodes: Node[]): Promise<{ uniqueInputs: any[] }> {
    const { inputs, outputs } = await this.extractInputsAndOutputs(nodes);
    const outputFields = new Set(
      outputs
        // check for exceptions where input is transformed and exclude from output fields
        .filter((outputField) =>
          outputField.exception
            ? outputField.exception.includes(outputField.key)
              ? outputField.exception === outputField.key
              : true
            : true,
        )
        .map((outputField) => outputField.property),
    );
    const uniqueInputFields = this.findUniqueFields(inputs, outputFields);

    return {
      uniqueInputs: Object.values(uniqueInputFields),
    };
  }

  // generate a rule schema from a list of nodes that represent the origin inputs and all outputs of a rule
  async ruleSchema(ruleContent: RuleContent): Promise<RuleSchema> {
    if (!ruleContent) {
      throw new InvalidRuleContent('No content');
    }
    const { nodes, edges } = ruleContent;
    if (!nodes || !Array.isArray(nodes)) {
      throw new InvalidRuleContent('Rule has no nodes');
    }
    const inputs: any[] = (await this.extractUniqueInputs(nodes)).uniqueInputs;
    const generalOutputs: any[] = (await this.extractFields(nodes, 'outputs')).outputs;
    const resultOutputs: any[] = (await this.extractResultOutputs(nodes, edges)).resultOutputs;

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

  // generate a rule schema from a given local file
  async ruleSchemaFile(ruleFileName: string): Promise<any> {
    const fileContent = await this.documentsService.getFileContent(ruleFileName);
    const ruleContent = await JSON.parse(fileContent.toString());
    return this.ruleSchema(ruleContent);
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

  async inputOutputSchema(ruleContent: RuleContent): Promise<RuleSchema> {
    if (!ruleContent || !Array.isArray(ruleContent.nodes)) {
      throw new Error('Invalid rule content or missing nodes');
    }

    // Refactor flattenNodes to handle async properly
    const flattenNodes = async (nodes: Node[]): Promise<any[]> => {
      const result: any[] = [];

      for (const node of nodes) {
        if (node.type === 'decisionNode' && typeof node.content === 'object' && node.content?.key) {
          const generateNestedInputs = await this.inputOutputSchemaFile(node.content.key);
          const inputs = generateNestedInputs.inputs;
          result.push(...inputs); // Add inputs to the result array
        }
      }

      return result;
    };

    // Helper function to map fields to the desired format
    const mapFields = (fields: any[]) =>
      fields.map((field) => ({
        id: field.id,
        name: field.label,
        property: field.name,
        description: field.description,
        type: field.dataType,
        validationCriteria: field.validationCriteria,
        validationType: field.validationType,
        child_fields: field.child_fields,
      }));

    // Extract inputs from 'inputNode' type
    const inputNodes = ruleContent.nodes.filter((node) => node.type === 'inputNode');
    let inputs = inputNodes.flatMap((node) =>
      typeof node.content === 'object' && 'fields' in node.content ? mapFields(node.content.fields || []) : [],
    );

    // Fetch and concatenate nested inputs
    const nestedInputs = await flattenNodes(ruleContent.nodes);
    inputs = inputs.concat(nestedInputs); // Use concat to combine arrays

    // Extract outputs from 'outputNode' type
    const outputNodes = ruleContent.nodes.filter((node) => node.type === 'outputNode');
    const resultOutputs = outputNodes.flatMap((node) =>
      typeof node.content === 'object' && 'fields' in node.content ? mapFields(node.content.fields || []) : [],
    );

    // Return the schema with inputs and outputs
    return { inputs, resultOutputs };
  }

  async inputOutputSchemaFile(ruleFileName: string): Promise<RuleSchema> {
    const fileContent = await this.documentsService.getFileContent(ruleFileName);
    const ruleContent = JSON.parse(fileContent.toString());
    return this.inputOutputSchema(ruleContent);
  }
}
