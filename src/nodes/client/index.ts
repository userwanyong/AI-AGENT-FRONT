import { nanoid } from 'nanoid';

import { WorkflowNodeType } from '../constants';
import { FlowNodeRegistry } from '../../typings';
import iconClient from '../../assets/icon-client.jpg';
import { formMeta } from './form-meta';

let index = 0;
export const ClientNodeRegistry: FlowNodeRegistry = {
  type: WorkflowNodeType.Client,
  info: {
    icon: iconClient,
    description: '客户端',
  },
  meta: {
    defaultPorts: [{ type: 'input' }],
    // Condition Outputs use dynamic port
    useDynamicPort: true,
    expandable: false, // disable expanded
  },
  formMeta,
  onAdd() {
    return {
      id: `client_${nanoid(5)}`,
      type: WorkflowNodeType.Client,
      data: {
        title: `Client_${++index}`,
        inputsValues: {
          id: '',
          name: '',
          sequence: '',
        },
      },
    };
  },
};
