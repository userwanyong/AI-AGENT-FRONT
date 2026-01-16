import { Field } from '@flowgram.ai/free-layout-editor';
import { InputNumber } from '@douyinfe/semi-ui';

// import { useIsSidebar } from '../../../hooks';
import { FormItem, Feedback } from '../../../form-components';

export function SequenceInput() {
  // const readonly = !useIsSidebar();

  return (
    <Field<number> name="inputsValues.sequence">
      {({ field, fieldState }) => (
        <FormItem name="执行序号" type="number" required>
          <InputNumber
            value={Number(field.value)}
            onChange={(value) => {
              field.onChange(Number(value));
            }}
            // disabled={readonly}
            min={1}
            step={1}
            style={{ width: '100%' }}
            placeholder="请输入执行序号"
          />
          <Feedback errors={fieldState?.errors} />
        </FormItem>
      )}
    </Field>
  );
}
