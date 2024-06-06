import { Injectable } from '@nestjs/common';
import { Node } from './ruleMapping.interface';
import { DocumentsService } from '../documents/documents.service';

@Injectable()
export class RuleMappingService {
  extractInputs(nodes: Node[]): {
    inputs: any[];
  } {
    const inputs: any[] = [];

    nodes.forEach((node) => {
      if (node.content) {
        if (node.content.inputs) {
          node.content.inputs.forEach((inputField) => {
            inputs.push({
              id: inputField.id,
              name: inputField.name,
              type: inputField.type,
              property: inputField.field,
            });
          });
        }
        if (node.type === 'expressionNode') {
          node.content.expressions?.forEach((expr) => {
            inputs.push({
              key: expr.key,
              property: expr.value,
            });
          });
        }
      }
    });

    return { inputs };
  }

  extractOutputs(nodes: Node[]): {
    outputs: any[];
  } {
    const outputs: any[] = [];
    nodes.forEach((node) => {
      if (node.content) {
        if (node.content.outputs) {
          node.content.outputs.forEach((outputField) => {
            outputs.push({
              id: outputField.id,
              name: outputField.name,
              type: outputField.type,
              property: outputField.field,
            });
          });
        }
      }
    });

    return { outputs };
  }

  extractInputsAndOutputs(nodes: Node[]): {
    inputs: any[];
    outputs: any[];
  } {
    const inputs: any[] = this.extractInputs(nodes).inputs;
    const outputs: any[] = this.extractOutputs(nodes).outputs;
    return { inputs, outputs };
  }

  /**
   * Find unique fields that are not present in another set of fields.
   * @param fields - An array of field objects.
   * @param otherFields - A set of field names to compare against.
   * @returns An object containing the unique fields.
   */
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

  extractUniqueInputs(nodes: Node[]) {
    const { inputs, outputs } = this.extractInputsAndOutputs(nodes);
    const outputFields = new Set(outputs.map((outputField) => outputField.property));
    const uniqueInputFields = this.findUniqueFields(inputs, outputFields);

    return {
      uniqueInputs: Object.values(uniqueInputFields),
    };
  }

  // generate a rule schema from a list of nodes that represent the origin inputs and all outputs of a rule
  ruleSchema(nodes: Node[]): {
    inputs: any[];
    outputs: any[];
    inputsAndOutputsLength: string;
  } {
    const inputs: any[] = this.extractUniqueInputs(nodes).uniqueInputs;
    const outputs: any[] = this.extractOutputs(nodes).outputs;

    // Provide information about the number of inputs and outputs in the schema
    const inputsAndOutputsLength = `Inputs: ${inputs.length}, Outputs: ${outputs.length}`;

    return { inputsAndOutputsLength, inputs, outputs };
  }

  // generate a rule schema from a given local file
  async ruleSchemaFile(filePath: string): Promise<any> {
    const documentsService = new DocumentsService();
    const fileContent = await documentsService.getFileContent(filePath);
    const nodes = await JSON.parse(fileContent.toString()).nodes;
    console.log(nodes, 'this is nodes');
    return this.ruleSchema(nodes);
  }
}
