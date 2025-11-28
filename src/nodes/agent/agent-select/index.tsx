import { Field } from '@flowgram.ai/free-layout-editor';
import { Input, Select, TextArea } from '@douyinfe/semi-ui';

// import { useIsSidebar } from '../../../hooks';
import { FormItem } from '../../../form-components';
import { AgentPort } from './styles';

// 渠道选项
const channelOptions = [
  { label: '普通会话', value: 'ordinary' },
  { label: '临时会话', value: 'temporary' },
];

// 策略选项
const strategyOptions = [
  { label: 'Flow Agent Execute Strategy', value: 'flowExecuteStrategy' },
  { label: 'Auto Agent Execute Strategy', value: 'autoExecuteStrategy' },
  { label: 'Common Agent Execute Strategy', value: 'commonExecuteStrategy' },
];

export function AgentSelect() {
  // const readonly = !useIsSidebar();

  return (
    <div>
      {/* Agent名称 */}
      <Field<string> name="inputsValues.name">
        {({ field, fieldState }) => (
          <FormItem name="Agent名称" type="string" required={true} labelWidth={80}>
            <Input
              placeholder="请输入Agent名称"
              style={{ width: '100%' }}
              value={field.value || ''}
              onChange={(value) => field.onChange(String(value || ''))}
              // disabled={readonly}
            />
          </FormItem>
        )}
      </Field>

      {/* Agent描述 */}
      <Field<string> name="inputsValues.description">
        {({ field, fieldState }) => (
          <FormItem name="描述" type="string" required={true} labelWidth={80}>
            <TextArea
              placeholder="请输入Agent描述"
              style={{ width: '100%' }}
              rows={3}
              value={field.value || ''}
              onChange={(value) => field.onChange(String(value || ''))}
              // disabled={readonly}
            />
          </FormItem>
        )}
      </Field>

      {/* 渠道选择 */}
      <Field<string> name="inputsValues.channel">
        {({ field, fieldState }) => (
          <FormItem name="类型" type="string" required={true} labelWidth={80}>
            <Select
              placeholder="请选择会话类型"
              style={{ width: '100%' }}
              value={field.value || ''}
              onChange={(value) => field.onChange(String(value || ''))}
              // disabled={readonly}
              optionList={channelOptions}
            />
          </FormItem>
        )}
      </Field>

      {/* 策略选择 */}
      <Field<string> name="inputsValues.strategy">
        {({ field, fieldState }) => (
          <FormItem name="策略" type="string" required={true} labelWidth={80}>
            <Select
              placeholder="请选择策略"
              style={{ width: '100%' }}
              value={field.value || ''}
              onChange={(value) => field.onChange(String(value || ''))}
              // disabled={readonly}
              optionList={strategyOptions}
            />
            {/* 添加输出端口标记，使节点可以从右侧连线 */}
            <AgentPort data-port-id="agent-output" data-port-type="output" />
          </FormItem>
        )}
      </Field>
    </div>
  );
}
