import { Injectable } from '@nestjs/common';
import { runDecision } from '../../services/gorules';

@Injectable()
export class DecisionsService {
  constructor() {}

  async runDecision(inputs: object) {
    return runDecision('wintersupplement', inputs);
  }
}
