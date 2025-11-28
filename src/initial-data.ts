import { FlowDocumentJSON } from './typings';

export const initialData: FlowDocumentJSON = {
  nodes: [
    {
      id: 'start_0',
      type: 'start',
      meta: {
        position: {
          x: -842,
          y: 39.5,
        },
      },
      data: {
        title: 'Start',
        outputs: {
          type: 'object',
          required: [],
        },
      },
    },
    {
      id: 'agent_QyqMj',
      type: 'agent',
      meta: {
        position: {
          x: -444,
          y: 39.5,
        },
      },
      data: {
        title: 'Agent_1',
        inputsValues: {
          name: '',
          description: '',
          channel: '',
          strategy: '',
        },
      },
    },
  ],
  edges: [
    {
      sourceNodeID: 'start_0',
      targetNodeID: 'agent_QyqMj',
    },
  ],
};
