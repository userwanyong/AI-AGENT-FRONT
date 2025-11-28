import { useEffect, useState } from 'react';

import { Field } from '@flowgram.ai/free-layout-editor';
import { Select } from '@douyinfe/semi-ui';

import { AiClientSystemPromptResponseDTO } from '../../../services/ai-client-system-prompt-service';
import { AiClientSystemPromptService } from '../../../services';
// import { useIsSidebar } from '../../../hooks';
import { FormItem } from '../../../form-components';

// import { PromptPort } from './styles';

export function PromptSelect() {
  // const readonly = !useIsSidebar();
  const [promptOptions, setPromptOptions] = useState<{ label: string; value: string }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchPrompts = async () => {
      try {
        setLoading(true);
        const prompts = await AiClientSystemPromptService.queryEnableAiClientSystemPrompts();
        // 转换API数据为Select组件需要的格式
        const options = prompts.map((prompt: AiClientSystemPromptResponseDTO) => ({
          label: prompt.name,
          value: prompt.id,
        }));
        setPromptOptions(options);
      } catch (error) {
        console.error('获取系统提示词列表失败:', error);
        setPromptOptions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPrompts();
  }, []);

  return (
    <Field<string> name="inputsValues.name">
      {({ field: nameField }) => (
        <Field<string> name="inputsValues.id">
          {({ field: idField }) => (
            <FormItem name="系统提示词" type="string" required={true} labelWidth={80}>
              <Select
                placeholder={loading ? '加载中...' : '请选择系统提示词'}
                style={{ width: '100%' }}
                value={nameField.value}
                onChange={(value) => {
                  const find = promptOptions.find((option) => option.value === value);
                  if (find) {
                    nameField.onChange(find.label);
                    idField.onChange(find.value);
                  }
                }}
                // disabled={readonly || loading}
                disabled={loading}
                loading={loading}
                optionList={promptOptions}
              />
            </FormItem>
          )}
        </Field>
      )}
    </Field>
  );
}
