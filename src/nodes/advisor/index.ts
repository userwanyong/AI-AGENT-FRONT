import { nanoid } from 'nanoid';

import { WorkflowNodeType } from '../constants';
import { FlowNodeRegistry } from '../../typings';
import iconAdvisor from '../../assets/icon-advisor.svg';
import { formMeta } from './form-meta';

let index = 0;
export const AdvisorNodeRegistry: FlowNodeRegistry = {
  type: WorkflowNodeType.Advisor,
  info: {
    icon: iconAdvisor,
    description: '顾问角色',
  },
  formMeta,
  meta: {
    defaultPorts: [{ type: 'input' }],
    // Advisor Outputs use dynamic port
    useDynamicPort: true,
    expandable: false, // disable expanded
  },
  onAdd() {
    return {
      id: `advisor_${nanoid(5)}`,
      type: 'advisor',
      data: {
        title: `Advisor_${++index}`,
        inputsValues: {
          id: '',
          name: '',
        },
      },
    };
  },
};
