import { ValidationService } from './validations.service';
import { ValidationError } from './validation.error';

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
  });

  describe('validateField', () => {
    it('should validate number input', () => {
      const field = { field: 'age', type: 'number-input' };
      const context = { age: 25 };
      expect(() => validator['validateField'](field, context)).not.toThrow();
    });

    it('should validate date input', () => {
      const field = { field: 'birthDate', type: 'date' };
      const context = { birthDate: '2000-01-01' };
      expect(() => validator['validateField'](field, context)).not.toThrow();
    });

    it('should validate text input', () => {
      const field = { field: 'name', type: 'text-input' };
      const context = { name: 'John Doe' };
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
});
