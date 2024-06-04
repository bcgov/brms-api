import { Injectable } from '@nestjs/common';
import { Node } from './ruleMapping.interface';

@Injectable()
export class RuleMappingService {
  extractInputsAndOutputs(nodes: Node[]): {
    inputs: any[];
    outputs: any[];
  } {
    const inputs: any[] = [];
    const outputs: any[] = [];

    nodes.forEach((node) => {
      if (node.content) {
        if (node.content.inputs) {
          node.content.inputs.forEach((inputField) => {
            inputs.push({
              id: inputField.id,
              name: inputField.name,
              type: inputField.type,
              field: inputField.field,
            });
          });
        }
        if (node.content.outputs) {
          node.content.outputs.forEach((outputField) => {
            outputs.push({
              id: outputField.id,
              name: outputField.name,
              type: outputField.type,
              field: outputField.field,
            });
          });
        }
        if (node.type === 'expressionNode') {
          node.content.expressions?.forEach((expr) => {
            inputs.push({
              key: expr.key,
              value: expr.value,
            });
          });
        }
      }
    });

    return { inputs, outputs };
  }

  // Find unique fields that are not present in another set of fields
  findUniqueFields(fields: any[], otherFields: Set<string>): { [key: string]: any } {
    const uniqueFields: { [key: string]: any } = {};
    fields.forEach((field) => {
      const fieldValue = field.field ?? field.value;
      if (!otherFields.has(fieldValue)) {
        uniqueFields[fieldValue] = field;
      }
    });
    return uniqueFields;
  }

  processJsonData(nodes: Node[]) {
    const { inputs, outputs } = this.extractInputsAndOutputs(nodes);

    const inputFields = new Set(inputs.map((inputField) => inputField.field ?? inputField.value));
    const outputFields = new Set(outputs.map((outputField) => outputField.field));

    const uniqueOutputFields = this.findUniqueFields(outputs, inputFields);
    const uniqueInputFields = this.findUniqueFields(inputs, outputFields);

    // Printing inputs that are not also outputs with unique 'field' values
    console.log('\nUnique Inputs');
    Object.values(uniqueInputFields).forEach((uniqueField) => console.log(uniqueField));

    // Printing outputs that are not also inputs with unique 'field' values
    console.log('\nUnique Outputs');
    Object.values(uniqueOutputFields).forEach((uniqueField) => console.log(uniqueField));

    return {
      uniqueInputs: Object.values(uniqueInputFields),
      uniqueOutputs: Object.values(uniqueOutputFields),
    };
  }
}
