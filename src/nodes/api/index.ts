import { nanoid } from 'nanoid';

import { WorkflowNodeType } from '../constants';
import { FlowNodeRegistry } from '../../typings';
import iconAdvisor from '../../assets/icon-advisor.svg';
import { formMeta } from './form-meta';

let index = 0;
export const ApiNodeRegistry: FlowNodeRegistry = {
  type: WorkflowNodeType.API,
  info: {
    icon: iconAdvisor,
    description: 'api',
  },
  formMeta,
  meta: {
    defaultPorts: [{ type: 'input' }],
    // Api Outputs use dynamic port
    useDynamicPort: true,
    expandable: false, // disable expanded
  },
  onAdd() {
    return {
      id: `api_${nanoid(5)}`,
      type: 'api',
      data: {
        title: `Api_${++index}`,
        inputsValues: {
          id: '',
          baseUrl: '',
        },
      },
    };
  },
};
