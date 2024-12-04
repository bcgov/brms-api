/**
 * This is just some basic initial data
 * for a couple of rules in order to populate the database
 * and ensure the project works as expected
 **/

db = db.getSiblingDB('brms-db');

db.createCollection('ruledrafts');

db.ruledrafts.insertMany([
  {
    _id: '6724122ef3753b734546db9d',
    content: {
      contentType: 'application/vnd.gorules.decision',
      edges: [
        {
          id: '9f88d22a-bd9f-4082-856b-7cfe2dbaae78',
          type: 'edge',
          sourceId: '6e70304c-a2e3-4d5a-9541-bb97c3038665',
          targetId: 'ea124db4-20bc-46bb-99ea-202a55b55b5b',
        },
        {
          id: '3b9fe63d-f493-457b-b2c8-1ec04b3c075b',
          sourceId: 'a4568c5b-a4be-4222-b379-02bc117dcb29',
          type: 'edge',
          targetId: '6e70304c-a2e3-4d5a-9541-bb97c3038665',
        },
        {
          id: '4aae948b-ec25-4d66-a474-dba321306153',
          sourceId: 'a023eb5d-4691-49c9-9e85-dfcc687801d9',
          type: 'edge',
          targetId: '862b9aae-f2ed-4832-aab7-68676c8124eb',
        },
        {
          id: '262cb68e-4aee-42bb-b4b8-be0a16a3d5a9',
          sourceId: '862b9aae-f2ed-4832-aab7-68676c8124eb',
          type: 'edge',
          targetId: '6e70304c-a2e3-4d5a-9541-bb97c3038665',
          sourceHandle: '91271c97-325c-435d-afec-fed17be9ea67',
        },
        {
          id: '47e2bda3-f0e2-46cf-9bb7-599233b60c7e',
          sourceId: '862b9aae-f2ed-4832-aab7-68676c8124eb',
          type: 'edge',
          targetId: 'ea124db4-20bc-46bb-99ea-202a55b55b5b',
          sourceHandle: '8f469792-0352-4541-a593-eec3cce87696',
        },
        {
          id: '44ba334a-ad74-4aa2-af57-0189af94c949',
          sourceId: '862b9aae-f2ed-4832-aab7-68676c8124eb',
          type: 'edge',
          targetId: 'a4568c5b-a4be-4222-b379-02bc117dcb29',
          sourceHandle: '91271c97-325c-435d-afec-fed17be9ea67',
        },
      ],
      nodes: [
        {
          id: 'a023eb5d-4691-49c9-9e85-dfcc687801d9',
          name: 'request',
          type: 'inputNode',
          position: { x: -185, y: 205 },
          content: {
            fields: [
              {
                field: 'dependentsList',
                name: 'Dependents List',
                id: 8,
                description: 'A list of dependent active on a case with their relevant properties.',
                dataType: 'object-array',
                childFields: [
                  { id: 40, name: 'personID', field: 'Person ID', description: null, dataType: 'text-input' },
                  {
                    id: 64,
                    name: 'dateOfBirth',
                    field: 'Date of Birth',
                    description: 'The specific date of birth for an individual.',
                    dataType: 'date',
                    validationCriteria: '1910-01-01',
                    validationType: '>=',
                  },
                  {
                    id: 69,
                    name: 'inSchool',
                    field: 'In School',
                    description: 'Individual is currently in school.',
                    dataType: 'true-false',
                  },
                ],
              },
              {
                field: 'personID',
                name: 'Person ID',
                id: 40,
                description: null,
                dataType: 'text-input',
                childFields: [],
              },
              {
                field: 'isMultiplePregnancy',
                name: 'Is Multiple Pregnancy',
                id: 57,
                description:
                  'Whether or not the pregnancy is a multiple or single. True indicates a multiple pregnancy.',
                dataType: 'true-false',
                childFields: [],
              },
            ],
          },
        },
        {
          id: 'ea124db4-20bc-46bb-99ea-202a55b55b5b',
          name: 'response',
          type: 'outputNode',
          position: { x: 665, y: 210 },
          content: {
            fields: [
              {
                field: 'reason',
                name: 'Reason',
                id: 47,
                description: 'The reason provided for a given decision.',
                dataType: 'text-input',
                childFields: [],
              },
              {
                field: 'isActiveOnCase',
                name: 'Is Active On Case',
                id: 27,
                description: "Individual is 'active' on case.",
                dataType: 'true-false',
                childFields: [],
              },
            ],
          },
        },
        {
          id: '6e70304c-a2e3-4d5a-9541-bb97c3038665',
          name: 'Check if active on case',
          type: 'decisionTableNode',
          content: {
            hitPolicy: 'first',
            inputs: [
              {
                id: 'b2cf9f67-055f-4b21-b77f-4d801dd5ef76',
                name: 'Dependents List',
                type: 'expression',
                field: 'dependentsList',
              },
              { id: '56b6531a-219d-4edb-b518-0201a2f58219', field: 'personID', name: 'Person ID' },
            ],
            outputs: [
              {
                id: '4303d58e-47f2-4f8f-aef2-96070d5c4319',
                name: 'Is Active On Case',
                type: 'expression',
                field: 'isActiveOnCase',
              },
              { id: '71544763-067f-41ea-bae3-a445418b9261', name: 'Reason', type: 'expression', field: 'reason' },
            ],
            rules: [
              {
                _id: '048934cd-fb94-4508-937f-c128d45beb3e',
                'b2cf9f67-055f-4b21-b77f-4d801dd5ef76': 'contains(dependentsIDs, personID)',
                '56b6531a-219d-4edb-b518-0201a2f58219': '',
                '4303d58e-47f2-4f8f-aef2-96070d5c4319': 'true',
                '71544763-067f-41ea-bae3-a445418b9261': '',
              },
              {
                _id: '0936bf97-d254-4ec5-aebc-d41d11ec74fd',
                'b2cf9f67-055f-4b21-b77f-4d801dd5ef76': '',
                '56b6531a-219d-4edb-b518-0201a2f58219': '',
                '4303d58e-47f2-4f8f-aef2-96070d5c4319': 'false',
                '71544763-067f-41ea-bae3-a445418b9261': "'Person not listed on the case as a dependent.'",
              },
            ],
          },
          position: { x: 380, y: 320 },
        },
        {
          type: 'expressionNode',
          content: {
            expressions: [
              {
                id: 'ee032223-2e2c-4fd4-85c7-304c361b0634',
                key: 'dependentsIDs',
                value: 'map(dependentsList, #.personID)',
              },
            ],
          },
          id: 'a4568c5b-a4be-4222-b379-02bc117dcb29',
          name: 'Filter IDs',
          position: { x: 375, y: 200 },
        },
        {
          type: 'switchNode',
          content: {
            hitPolicy: 'first',
            statements: [
              {
                id: '91271c97-325c-435d-afec-fed17be9ea67',
                condition: 'dependentsList != null and len(dependentsList) > 0',
                isDefault: false,
              },
              { id: '8f469792-0352-4541-a593-eec3cce87696', condition: '', isDefault: true },
            ],
          },
          id: '862b9aae-f2ed-4832-aab7-68676c8124eb',
          name: 'Any Dependents?',
          position: { x: 100, y: 190 },
        },
      ],
    },
    __v: 0,
  },
  {
    _id: '670ec464903cf948805980e1',
    content: {
      contentType: 'application/vnd.gorules.decision',
      nodes: [
        {
          id: 'd4b75ff1-c189-4c99-befd-34a048ea36dc',
          name: 'GuideDogServiceSupplement',
          type: 'inputNode',
          position: { x: 205, y: 205 },
          content: {
            fields: [
              {
                field: 'familyUnitInPay',
                name: 'Family Unit In Pay',
                id: 18,
                description: 'Family unit is in pay.',
                dataType: 'true-false',
                childFields: [],
              },
              {
                field: 'usesGuideDog',
                name: 'Uses Guide Dog',
                id: 59,
                description: 'Individual uses a guide dog.',
                dataType: 'true-false',
                childFields: [],
              },
              {
                field: 'numberOfRecipients',
                name: 'Number of Recipients',
                id: 37,
                description: 'The number of individuals expected to count for a specific assessment.',
                dataType: 'number-input',
                validationCriteria: '0',
                validationType: '>=',
                childFields: [],
              },
              {
                field: 'guideDogDocumentationType',
                name: 'Guide Dog Documentation Type',
                id: 22,
                description: 'The type of documentation received for the guide dog.',
                dataType: 'text-input',
                validationCriteria: 'certification, testBooked',
                validationType: '[=text]',
                childFields: [],
              },
            ],
          },
        },
        {
          id: 'ff32aa69-c432-4205-93f8-7f6e3c57c2f3',
          name: 'Eligibility',
          type: 'decisionTableNode',
          content: {
            rules: [
              {
                _id: '1468e0db-8faf-468d-b9f7-54b8bdc7ea5d',
                '17726155-ad08-49e7-901f-7337611630aa': 'false',
                '4eef6312-1689-4e3e-90c8-21efc312aba5': '"certification"',
                'a91c0dbe-4622-41b9-94cd-b5bff7ed1ffc': 'true',
                'd1465f38-5770-41fe-b4c6-64ab07562a67': 'true',
                'e30caacc-23e4-40d8-b8f3-976bb5bc36f9': 'true',
              },
              {
                _id: 'e07580c9-79a4-46ec-b36a-8b0e0c6e9750',
                '17726155-ad08-49e7-901f-7337611630aa': 'true',
                '4eef6312-1689-4e3e-90c8-21efc312aba5': '"testBooked"',
                'a91c0dbe-4622-41b9-94cd-b5bff7ed1ffc': 'true',
                'd1465f38-5770-41fe-b4c6-64ab07562a67': 'true',
                'e30caacc-23e4-40d8-b8f3-976bb5bc36f9': 'true',
              },
              {
                _id: '9e372954-b632-40f6-8e6e-d34190cf0a1c',
                '17726155-ad08-49e7-901f-7337611630aa': '',
                '4eef6312-1689-4e3e-90c8-21efc312aba5': '',
                'a91c0dbe-4622-41b9-94cd-b5bff7ed1ffc': '',
                'd1465f38-5770-41fe-b4c6-64ab07562a67': '',
                'e30caacc-23e4-40d8-b8f3-976bb5bc36f9': 'false',
              },
            ],
            inputs: [
              {
                id: 'a91c0dbe-4622-41b9-94cd-b5bff7ed1ffc',
                name: 'Family Unit In Pay',
                type: 'expression',
                field: 'familyUnitInPay',
                defaultValue: 'false',
              },
              {
                id: 'd1465f38-5770-41fe-b4c6-64ab07562a67',
                name: 'Uses Guide Dog',
                type: 'expression',
                field: 'usesGuideDog',
                defaultValue: 'false',
              },
              {
                id: '4eef6312-1689-4e3e-90c8-21efc312aba5',
                name: 'Guide Dog Documentation Type',
                type: 'expression',
                field: 'guideDogDocumentationType',
              },
            ],
            outputs: [
              {
                id: 'e30caacc-23e4-40d8-b8f3-976bb5bc36f9',
                name: 'IsEligible',
                type: 'expression',
                field: 'isEligible',
                defaultValue: 'false',
              },
              {
                id: '17726155-ad08-49e7-901f-7337611630aa',
                name: 'Two MonthEligibility',
                type: 'expression',
                field: 'twoMonthEligibility',
                defaultValue: 'false',
              },
            ],
            hitPolicy: 'first',
          },
          position: { x: 615, y: 165 },
        },
        {
          id: '3d92a47a-f301-4481-a287-84fa41daec6a',
          name: 'GuideDogServiceSupplement',
          type: 'outputNode',
          position: { x: 1245, y: 200 },
          content: {
            fields: [
              {
                field: 'twoMonthEligibility',
                name: 'Two Month Eligibility',
                id: 65,
                description:
                  'Whether or not an individual must pass the two month eligibility period to be eligible for a supplement.',
                dataType: 'true-false',
                childFields: [],
              },
              {
                field: 'isEligible',
                name: 'Is Eligible',
                id: 28,
                description:
                  'General "Is Eligible" statement used in conjunction with supplement building to describe eligibility.',
                dataType: 'true-false',
                childFields: [],
              },
              {
                field: 'supplementAmount',
                name: 'Supplement Amount',
                id: 58,
                description:
                  'General "Supplement Amount" field to define total supplement amount output for a specific supplement.',
                dataType: 'number-input',
                validationCriteria: '0',
                validationType: '>=',
                childFields: [],
              },
            ],
          },
        },
        {
          id: '1898e029-9790-4352-b3d2-9c2cc7b27da7',
          name: 'Supplement Calculation',
          type: 'decisionTableNode',
          content: {
            hitPolicy: 'first',
            inputs: [
              {
                id: '52ea306d-6249-4ba1-b544-6cc4c54e847a',
                name: 'Number of Recipients',
                type: 'expression',
                field: 'numberOfRecipients',
              },
              {
                id: '78a77996-923f-4a0e-bc1d-af7cc3486578',
                name: 'Is Eligible',
                type: 'expression',
                field: 'isEligible',
                defaultValue: '',
              },
            ],
            outputs: [
              {
                id: 'c6c3a8bc-99bc-4512-b0e4-94d194df3da0',
                name: 'Supplement Amount',
                type: 'expression',
                field: 'supplementAmount',
              },
            ],
            rules: [
              {
                _id: 'ba057bc7-9043-4d53-89bc-99d1a1f6c80c',
                '52ea306d-6249-4ba1-b544-6cc4c54e847a': '',
                '78a77996-923f-4a0e-bc1d-af7cc3486578': 'true',
                'c6c3a8bc-99bc-4512-b0e4-94d194df3da0': 'numberOfRecipients*95',
              },
            ],
          },
          position: { x: 790, y: 335 },
        },
      ],
      edges: [
        {
          id: '961d84c0-ecf0-4187-9d9c-6e0940c3d094',
          type: 'edge',
          sourceId: 'd4b75ff1-c189-4c99-befd-34a048ea36dc',
          targetId: 'ff32aa69-c432-4205-93f8-7f6e3c57c2f3',
        },
        {
          id: '6e953442-2b52-4533-bb3c-3bd7add51a0e',
          type: 'edge',
          sourceId: 'ff32aa69-c432-4205-93f8-7f6e3c57c2f3',
          targetId: '1898e029-9790-4352-b3d2-9c2cc7b27da7',
        },
        {
          id: 'd7aad29f-df79-4c0e-ac35-ece0acf08109',
          type: 'edge',
          sourceId: '1898e029-9790-4352-b3d2-9c2cc7b27da7',
          targetId: '3d92a47a-f301-4481-a287-84fa41daec6a',
        },
        {
          id: '95554aa5-7fb5-4c98-8e5e-92977de919ae',
          type: 'edge',
          sourceId: 'ff32aa69-c432-4205-93f8-7f6e3c57c2f3',
          targetId: '3d92a47a-f301-4481-a287-84fa41daec6a',
        },
        {
          id: '34aec31e-0d2a-4cfb-b938-8a3e2b2513af',
          type: 'edge',
          sourceId: 'd4b75ff1-c189-4c99-befd-34a048ea36dc',
          targetId: '1898e029-9790-4352-b3d2-9c2cc7b27da7',
        },
      ],
    },
    __v: 0,
  },
]);

db.createCollection('ruledatas');

db.ruledatas.insertMany([
  {
    _id: '666cd9b6ea5dd2e65c0b897a',
    __v: 0,
    title: 'Util - Is a person active on a case as a dependent',
    isPublished: true,
    ruleDraft: '6724122ef3753b734546db9d',
    filepath: 'util/is_a_person_active_on_a_case_as_a_dependent.json',
    name: 'is_a_person_active_on_a_case_as_a_dependent',
  },
  {
    _id: '6670c8499c32057b791a890b',
    __v: 0,
    title: 'Guide Dog & Service Dog Supplement',
    isPublished: true,
    ruleDraft: '670ec464903cf948805980e1',
    filepath: 'general-supplements/guidedogsupplement.json',
    name: 'guidedogsupplement',
    reviewBranch: null,
  },
]);

db.createCollection('scenariodatas');

db.scenariodatas.insertMany([
  {
    _id: '66f5cd5c59c3debf6f776b08',
    title: 'Active Dependent',
    ruleID: '666cd9b6ea5dd2e65c0b897a',
    variables: [
      {
        name: 'dependentsList',
        value: [{ personID: 'P1234', dateOfBirth: null, inSchool: null }],
        type: 'object',
        _id: '66f5cd5c59c3debf6f776b09',
      },
      { name: 'personID', value: 'P1234', type: 'string', _id: '66f5cd5c59c3debf6f776b0a' },
    ],
    expectedResults: [],
    __v: 0,
    filepath: 'util/is_a_person_active_on_a_case_as_a_dependent.json',
  },
  {
    _id: '6706a945903cf94880588ad4',
    title: 'Dependent on Case',
    ruleID: '666cd9b6ea5dd2e65c0b897a',
    variables: [
      {
        name: 'dependentsList',
        value: [{ personID: 'P1234', dateOfBirth: '2024-10-07', inSchool: null }],
        type: 'object',
        _id: '6706a945903cf94880588ad5',
      },
      { name: 'personID', value: 'P1234', type: 'string', _id: '6706a945903cf94880588ad6' },
    ],
    expectedResults: [{ name: 'isActiveOnCase', value: true, type: 'boolean', _id: '6706a945903cf94880588ad7' }],
    filepath: 'util/is_a_person_active_on_a_case_as_a_dependent.json',
    __v: 0,
  },
  {
    _id: '66c8c3691aeab403143cb48a',
    title: 'Certification - 3',
    ruleID: '6670c8499c32057b791a890b',
    variables: [
      { name: 'familyUnitInPay', value: true, type: 'boolean', _id: '66c8c3691aeab403143cb48b' },
      { name: 'usesGuideDog', value: true, type: 'boolean', _id: '66c8c3691aeab403143cb48c' },
      {
        name: 'guideDogDocumentationType',
        value: 'certification',
        type: 'string',
        _id: '66c8c3691aeab403143cb48d',
      },
      { name: 'numberOfRecipients', value: 3, type: 'number', _id: '66c8c3691aeab403143cb48e' },
    ],
    expectedResults: [{ name: 'isEligible', value: 0, type: 'number', _id: '66c8c3691aeab403143cb48f' }],
    __v: 0,
    filepath: 'general-supplements/guidedogsupplement.json',
  },
  {
    _id: '670ee52d903cf9488059845e',
    title: 'Test Booked - Two Month Eligibility',
    ruleID: '6670c8499c32057b791a890b',
    variables: [
      { name: 'familyUnitInPay', value: true, type: 'boolean', _id: '670ee52d903cf9488059845f' },
      { name: 'usesGuideDog', value: true, type: 'boolean', _id: '670ee52d903cf94880598460' },
      { name: 'numberOfRecipients', value: 1, type: 'number', _id: '670ee52d903cf94880598461' },
      {
        name: 'guideDogDocumentationType',
        value: 'testBooked',
        type: 'string',
        _id: '670ee52d903cf94880598462',
      },
    ],
    expectedResults: [
      { name: 'twoMonthEligibility', value: true, type: 'boolean', _id: '670ee52d903cf94880598463' },
      { name: 'isEligible', value: true, type: 'boolean', _id: '670ee52d903cf94880598464' },
      { name: 'supplementAmount', value: 95, type: 'number', _id: '670ee52d903cf94880598465' },
    ],
    filepath: 'general-supplements/guidedogsupplement.json',
    __v: 0,
  },
  {
    _id: '670ee58b903cf9488059847d',
    title: 'Does not use guide dog',
    ruleID: '6670c8499c32057b791a890b',
    variables: [
      { name: 'familyUnitInPay', value: true, type: 'boolean', _id: '670fe8ab903cf9488059a3b7' },
      { name: 'usesGuideDog', value: false, type: 'boolean', _id: '670fe8ab903cf9488059a3b8' },
      { name: 'numberOfRecipients', value: 1, type: 'number', _id: '670fe8ab903cf9488059a3b9' },
      {
        name: 'guideDogDocumentationType',
        value: 'certification',
        type: 'string',
        _id: '670fe8ab903cf9488059a3ba',
      },
    ],
    expectedResults: [{ name: 'isEligible', value: false, type: 'boolean', _id: '670fe8ab903cf9488059a3bb' }],
    filepath: 'general-supplements/guidedogsupplement.json',
    __v: 1,
  },
]);
