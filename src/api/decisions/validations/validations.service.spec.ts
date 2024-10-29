import { ValidationService } from './validations.service';
import { ValidationError } from './validation.error';

describe('ValidationError', () => {
  it('should be an instance of ValidationError', () => {
    const error = new ValidationError('Test message');
    expect(error).toBeInstanceOf(ValidationError);
    expect(error.name).toBe('ValidationError');
  });

  it('should have correct prototype', () => {
    const error = new ValidationError('Test message');
    expect(Object.getPrototypeOf(error)).toBe(ValidationError.prototype);
  });

  it('should return correct error code', () => {
    const error = new ValidationError('Test message');
    expect(error.getErrorCode()).toBe('VALIDATION_ERROR');
  });

  it('should return correct JSON representation', () => {
    const error = new ValidationError('Test message');
    expect(error.toJSON()).toEqual({
      name: 'ValidationError',
      message: 'Test message',
      code: 'VALIDATION_ERROR',
    });
  });
});

describe('ValidationService', () => {
  let validator: ValidationService;

  beforeEach(() => {
    validator = new ValidationService();
  });

  describe('validateInputs', () => {
    it('should validate valid inputs', () => {
      const ruleContent = {
        fields: [
          { field: 'age', type: 'number-input' },
          { field: 'name', type: 'text-input' },
        ],
      };
      const context = { age: 25, name: 'John Doe' };
      expect(() => validator.validateInputs(ruleContent, context)).not.toThrow();
    });
    it('should return early if ruleContent is not an object', () => {
      const ruleContent = 'not an object';
      const context = {};
      expect(() => validator.validateInputs(ruleContent, context)).not.toThrow();
    });

    it('should return early if ruleContent.fields is not an array', () => {
      const ruleContent = { fields: 'not an array' };
      const context = {};
      expect(() => validator.validateInputs(ruleContent, context)).not.toThrow();
    });
    it('should return early if ruleContent.fields is empty', () => {
      const ruleContent = { fields: [] };
      const context = {};
      expect(() => validator.validateInputs(ruleContent, context)).not.toThrow();
    });
    it('should return early if context is empty', () => {
      const ruleContent = { fields: [] };
      const context = {};
      expect(() => validator.validateInputs(ruleContent, context)).not.toThrow();
    });
    it('returns early ruleContent.fields is not an array of objects', () => {
      const ruleContent = { fields: [{ field: 'age', type: 'number-input' }] };
      const context = { age: 25 };
      expect(() => validator.validateInputs(ruleContent, context)).not.toThrow();
    });
    it('returns blank if ruleContent.fields is an empty array', () => {
      const ruleContent = { fields: [] };
      const context = { age: 25 };
      expect(() => validator.validateInputs(ruleContent, context)).not.toThrow();
    });
    it('returns early if field.field is not in context', () => {
      const ruleContent = { fields: [{ field: 'age', type: 'number-input' }] };
      const context = {};
      expect(() => validator.validateInputs(ruleContent, context)).not.toThrow();
    });
    it('returns early if input is null or undefined', () => {
      const ruleContent = { fields: [{ field: 'age', type: 'number-input' }] };
      const context = { age: null };
      expect(() => validator.validateInputs(ruleContent, context)).not.toThrow();
      const context2 = { age: undefined };
      expect(() => validator.validateInputs(ruleContent, context2)).not.toThrow();
    });
  });

  describe('validateField', () => {
    it('throws an error for missing field.field', () => {
      const invalidField = { dataType: 'number-input' };
      expect(() => validator['validateField'](invalidField, {})).toThrow(ValidationError);
    });

    it('throws an error for unsupported data type in validateType', () => {
      const field = { field: 'testField', dataType: 'unsupported-type' };
      const context = { testField: 'value' };
      expect(() => validator['validateField'](field, context)).toThrow(ValidationError);
    });

    it('throws an error for mismatched input type in validateType', () => {
      const field = { field: 'testField', dataType: 'number-input' };
      const context = { testField: 'string' };
      expect(() => validator['validateField'](field, context)).toThrow(ValidationError);
    });

    it('should validate number input', () => {
      const field = { field: 'age', type: 'number-input' };
      const context = { age: 25 };
      expect(() => validator['validateField'](field, context)).not.toThrow();
    });
    it('should validate number input with validationType of [=nums]', () => {
      const field = { field: 'age', type: 'number-input', validationType: '[=nums]', validationCriteria: '[25, 26]' };
      const context = { age: [25, 26] };
      expect(() => validator['validateField'](field, context)).not.toThrow();
    });

    it('should validate date input', () => {
      const field = { field: 'birthDate', type: 'date' };
      const context = { birthDate: '2000-01-01' };
      expect(() => validator['validateField'](field, context)).not.toThrow();
    });

    it('should validate date input with validationType of [=dates]', () => {
      const field = {
        field: 'birthDate',
        type: 'date',
        validationType: '[=dates]',
        validationCriteria: '[2000-01-01, 2000-01-02]',
      };
      const context = { birthDate: ['2000-01-01', '2000-01-02'] };
      expect(() => validator['validateField'](field, context)).not.toThrow();
    });

    it('should validate text input', () => {
      const field = { field: 'name', type: 'text-input' };
      const context = { name: 'John Doe' };
      expect(() => validator['validateField'](field, context)).not.toThrow();
    });

    it('should validate text input with validationType of [=texts]', () => {
      const field = {
        field: 'name',
        type: 'text-input',
        validationType: '[=texts]',
        validationCriteria: 'John Doe, Jane Doe',
      };
      const context = { name: ['John Doe', 'Jane Doe'] };
      expect(() => validator['validateField'](field, context)).not.toThrow();
    });

    it('should validate boolean input', () => {
      const field = { field: 'isActive', type: 'true-false' };
      const context = { isActive: true };
      expect(() => validator['validateField'](field, context)).not.toThrow();
    });

    it('should throw ValidationError for invalid input type', () => {
      const field = { field: 'age', type: 'number-input' };
      const context = { age: 'twenty-five' };
      expect(() => validator['validateField'](field, context)).toThrow(ValidationError);
    });
  });

  describe('validateNumberCriteria', () => {
    it('should validate equal to criteria', () => {
      const field = { field: 'age', type: 'number-input', validationType: '==', validationCriteria: '25' };
      expect(() => validator['validateNumberCriteria'](field, 25)).not.toThrow();
      expect(() => validator['validateNumberCriteria'](field, 26)).toThrow(ValidationError);
    });

    it('should validate not equal to criteria', () => {
      const field = { field: 'age', type: 'number-input', validationType: '!=', validationCriteria: '25' };
      expect(() => validator['validateNumberCriteria'](field, 26)).not.toThrow();
      expect(() => validator['validateNumberCriteria'](field, 25)).toThrow(ValidationError);
    });

    it('should validate greater than or equal to criteria', () => {
      const field = { field: 'age', type: 'number-input', validationType: '>=', validationCriteria: '18' };
      expect(() => validator['validateNumberCriteria'](field, 18)).not.toThrow();
      expect(() => validator['validateNumberCriteria'](field, 20)).not.toThrow();
      expect(() => validator['validateNumberCriteria'](field, 17)).toThrow(ValidationError);
    });

    it('should validate greater than criteria', () => {
      const field = { field: 'age', type: 'number-input', validationType: '>', validationCriteria: '18' };
      expect(() => validator['validateNumberCriteria'](field, 19)).not.toThrow();
      expect(() => validator['validateNumberCriteria'](field, 17)).toThrow(ValidationError);
    });

    it('should validate less than or equal to criteria', () => {
      const field = { field: 'age', type: 'number-input', validationType: '<=', validationCriteria: '18' };
      expect(() => validator['validateNumberCriteria'](field, 18)).not.toThrow();
      expect(() => validator['validateNumberCriteria'](field, 17)).not.toThrow();
      expect(() => validator['validateNumberCriteria'](field, 19)).toThrow(ValidationError);
    });

    it('should validate less than criteria', () => {
      const field = { field: 'age', type: 'number-input', validationType: '<', validationCriteria: '18' };
      expect(() => validator['validateNumberCriteria'](field, 17)).not.toThrow();
      expect(() => validator['validateNumberCriteria'](field, 18)).toThrow(ValidationError);
    });

    it('should validate between exclusive criteria', () => {
      const field = { field: 'age', type: 'number-input', validationType: '(num)', validationCriteria: '[16, 20]' };
      expect(() => validator['validateNumberCriteria'](field, 17)).not.toThrow();
      expect(() => validator['validateNumberCriteria'](field, 19)).not.toThrow();
      expect(() => validator['validateNumberCriteria'](field, 16)).toThrow(ValidationError);
      expect(() => validator['validateNumberCriteria'](field, 20)).toThrow(ValidationError);
      expect(() => validator['validateNumberCriteria'](field, 21)).toThrow(ValidationError);
    });

    it('should validate between inclusive criteria', () => {
      const field = { field: 'age', type: 'number-input', validationType: '[num]', validationCriteria: '[16, 20]' };
      expect(() => validator['validateNumberCriteria'](field, 16)).not.toThrow();
      expect(() => validator['validateNumberCriteria'](field, 17)).not.toThrow();
      expect(() => validator['validateNumberCriteria'](field, 19)).not.toThrow();
      expect(() => validator['validateNumberCriteria'](field, 20)).not.toThrow();
      expect(() => validator['validateNumberCriteria'](field, 15)).toThrow(ValidationError);
      expect(() => validator['validateNumberCriteria'](field, 21)).toThrow(ValidationError);
    });

    it('should validate multiple criteria', () => {
      const field = {
        field: 'age',
        type: 'number-input',
        validationType: '[=num]',
        validationCriteria: '[18, 20]',
      };
      expect(() => validator['validateNumberCriteria'](field, 18)).not.toThrow();
      expect(() => validator['validateNumberCriteria'](field, 20)).not.toThrow();
      expect(() => validator['validateNumberCriteria'](field, 21)).toThrow(ValidationError);
    });

    it('should validate multiple criteria with multiple values', () => {
      const field = {
        field: 'age',
        type: 'number-input',
        validationType: '[=nums]',
        validationCriteria: '[18, 20]',
      };
      expect(() => validator['validateNumberCriteria'](field, [18])).not.toThrow();
      expect(() => validator['validateNumberCriteria'](field, [18, 20])).not.toThrow();
      expect(() => validator['validateNumberCriteria'](field, [19, 20])).toThrow(ValidationError);
    });
  });

  describe('validateDateCriteria', () => {
    it('should validate equal to criteria', () => {
      const field = { field: 'date', type: 'date', validationType: '==', validationCriteria: '2023-01-01' };
      expect(() => validator['validateDateCriteria'](field, '2023-01-01')).not.toThrow();
      expect(() => validator['validateDateCriteria'](field, '2023-01-02')).toThrow(ValidationError);
    });

    it('should validate not equal to criteria', () => {
      const field = { field: 'date', type: 'date', validationType: '!=', validationCriteria: '2023-01-01' };
      expect(() => validator['validateDateCriteria'](field, '2023-01-02')).not.toThrow();
      expect(() => validator['validateDateCriteria'](field, '2023-01-01')).toThrow(ValidationError);
    });

    it('should validate greater than criteria', () => {
      const field = { field: 'date', type: 'date', validationType: '>', validationCriteria: '2023-01-01' };
      expect(() => validator['validateDateCriteria'](field, '2023-01-02')).not.toThrow();
      expect(() => validator['validateDateCriteria'](field, '2023-01-01')).toThrow(ValidationError);
      expect(() => validator['validateDateCriteria'](field, '2022-12-31')).toThrow(ValidationError);
    });

    it('should validate greater than or equal to criteria', () => {
      const field = { field: 'date', type: 'date', validationType: '>=', validationCriteria: '2023-01-01' };
      expect(() => validator['validateDateCriteria'](field, '2023-01-01')).not.toThrow();
      expect(() => validator['validateDateCriteria'](field, '2023-01-02')).not.toThrow();
      expect(() => validator['validateDateCriteria'](field, '2022-01-01')).toThrow(ValidationError);
    });

    it('should validate less than criteria', () => {
      const field = { field: 'date', type: 'date', validationType: '<', validationCriteria: '2023-01-01' };
      expect(() => validator['validateDateCriteria'](field, '2022-12-31')).not.toThrow();
      expect(() => validator['validateDateCriteria'](field, '2023-01-01')).toThrow(ValidationError);
      expect(() => validator['validateDateCriteria'](field, '2023-01-02')).toThrow(ValidationError);
    });

    it('should validate less than or equal to criteria', () => {
      const field = { field: 'date', type: 'date', validationType: '<=', validationCriteria: '2023-01-01' };
      expect(() => validator['validateDateCriteria'](field, '2023-01-01')).not.toThrow();
      expect(() => validator['validateDateCriteria'](field, '2023-01-02')).toThrow(ValidationError);
    });

    it('should validate between exclusive criteria', () => {
      const field = {
        field: 'date',
        type: 'date',
        validationType: '(date)',
        validationCriteria: '[2023-01-01, 2024-01-03]',
      };
      expect(() => validator['validateDateCriteria'](field, '2023-01-02')).not.toThrow();
      expect(() => validator['validateDateCriteria'](field, '2024-01-02')).not.toThrow();
      expect(() => validator['validateDateCriteria'](field, '2023-06-05')).not.toThrow();
      expect(() => validator['validateDateCriteria'](field, '2024-01-04')).toThrow(ValidationError);
      expect(() => validator['validateDateCriteria'](field, '2022-12-31')).toThrow(ValidationError);
      expect(() => validator['validateDateCriteria'](field, '2023-01-01')).toThrow(ValidationError);
    });

    it('should validate between inclusive criteria', () => {
      const field = {
        field: 'date',
        type: 'date',
        validationType: '[date]',
        validationCriteria: '[2023-01-01, 2023-01-03]',
      };
      expect(() => validator['validateDateCriteria'](field, '2023-01-01')).not.toThrow();
      expect(() => validator['validateDateCriteria'](field, '2023-01-02')).not.toThrow();
      expect(() => validator['validateDateCriteria'](field, '2023-01-03')).not.toThrow();
      expect(() => validator['validateDateCriteria'](field, '2023-01-04')).toThrow(ValidationError);
      expect(() => validator['validateDateCriteria'](field, '2022-12-31')).toThrow(ValidationError);
    });

    it('should validate multiple criteria with single dates', () => {
      const field = {
        field: 'date',
        type: 'date',
        validationType: '[=date]',
        validationCriteria: '[2023-01-01, 2023-01-03]',
      };
      expect(() => validator['validateDateCriteria'](field, '2023-01-01')).not.toThrow();
      expect(() => validator['validateDateCriteria'](field, '2023-01-03')).not.toThrow();
      expect(() => validator['validateDateCriteria'](field, '2023-01-02')).toThrow(ValidationError);
      expect(() => validator['validateDateCriteria'](field, '2023-01-04')).toThrow(ValidationError);
    });

    it('should validate multiple criteria with multiple dates', () => {
      const field = {
        field: 'date',
        type: 'date',
        validationType: '[=dates]',
        validationCriteria: '[2023-01-01, 2023-01-03]',
      };
      expect(() => validator['validateDateCriteria'](field, ['2023-01-01'])).not.toThrow();
      expect(() => validator['validateDateCriteria'](field, ['2023-01-01', '2023-01-03'])).not.toThrow();
      expect(() => validator['validateDateCriteria'](field, ['2023-01-01', '2023-01-02'])).toThrow(ValidationError);
      expect(() => validator['validateDateCriteria'](field, ['2023-01-01', '2023-01-04'])).toThrow(ValidationError);
    });
  });

  describe('validateTextCriteria', () => {
    it('should validate equal to criteria', () => {
      const field = { field: 'status', type: 'text-input', validationType: '==', validationCriteria: 'active' };
      expect(() => validator['validateTextCriteria'](field, 'active')).not.toThrow();
      expect(() => validator['validateTextCriteria'](field, 'inactive')).toThrow(ValidationError);
    });

    it('should validate not equal to criteria', () => {
      const field = { field: 'status', type: 'text-input', validationType: '!=', validationCriteria: 'active' };
      expect(() => validator['validateTextCriteria'](field, 'inactive')).not.toThrow();
      expect(() => validator['validateTextCriteria'](field, 'active')).toThrow(ValidationError);
    });

    it('should validate regex criteria', () => {
      const field = {
        field: 'email',
        type: 'text-input',
        validationType: 'regex',
        validationCriteria: '^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$',
      };
      expect(() => validator['validateTextCriteria'](field, 'test@example.com')).not.toThrow();
      expect(() => validator['validateTextCriteria'](field, 'invalid-email')).toThrow(ValidationError);
    });

    it('should validate multiple criteria with single text', () => {
      const field = {
        field: 'status',
        type: 'text-input',
        validationType: '[=text]',
        validationCriteria: 'active,testing',
      };
      expect(() => validator['validateTextCriteria'](field, 'active')).not.toThrow();
      expect(() => validator['validateTextCriteria'](field, 'inactive')).toThrow(ValidationError);
    });

    it('should validate multiple criteria with multiple texts', () => {
      const field = {
        field: 'status',
        type: 'text-input',
        validationType: '[=texts]',
        validationCriteria: 'active,inactive',
      };
      expect(() => validator['validateTextCriteria'](field, ['active'])).not.toThrow();
      expect(() => validator['validateTextCriteria'](field, ['active', 'inactive'])).not.toThrow();
      expect(() => validator['validateTextCriteria'](field, ['active', 'inactive', 'testing'])).toThrow(
        ValidationError,
      );
    });
  });

  describe('ValidationService - Edge Cases in validateOutput', () => {
    it('throws an error when output does not match outputSchema', () => {
      const outputSchema = { field: 'output', dataType: 'number-input', validationType: '==', validationCriteria: '5' };
      const invalidOutput = { output: 10 };
      expect(() => validator.validateOutput(outputSchema, invalidOutput)).toThrow(ValidationError);
    });

    it('passes when output matches outputSchema', () => {
      const outputSchema = { field: 'output', dataType: 'number-input', validationType: '==', validationCriteria: '5' };
      const validOutput = 5;
      expect(() => validator.validateOutput(outputSchema, validOutput)).not.toThrow();
    });
  });
});
