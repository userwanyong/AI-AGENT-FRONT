import { FormRenderProps, FormMeta, ValidateTrigger } from '@flowgram.ai/free-layout-editor';

import { FlowNodeJSON } from '../../typings';
import { FormHeader, FormContent } from '../../form-components';
import { SequenceInput } from './sequence-input';
import { ClientSelect } from './client-select';

export const renderForm = ({ form }: FormRenderProps<FlowNodeJSON>) => (
  <>
    <FormHeader />
    <FormContent>
      <ClientSelect />
      <SequenceInput />
    </FormContent>
  </>
);

export const formMeta: FormMeta<FlowNodeJSON> = {
  render: renderForm,
  validateTrigger: ValidateTrigger.onChange,
  validate: {
    title: ({ value }: { value: string }) => (value ? undefined : 'Title is required'),
    'inputsValues.name.*': ({ value }) => {
      if (!value?.value) return '请选择客户端类型';
      return undefined;
    },
    'inputsValues.sequence.*': ({ value }) => {
      if (value < 1) return '执行序号必须大于等于1';
      return undefined;
    },
  },
};
