import { useEffect, useState } from 'react';

import { Field } from '@flowgram.ai/free-layout-editor';
import { Select } from '@douyinfe/semi-ui';

import type { AiClientModelResponseDTO } from '../../../services/ai-client-model-service';
import { AiClientModelService } from '../../../services';
import { FormItem } from '../../../form-components';
import { ModelPort } from './styles';

export function ModelSelect() {
  const [modelOptions, setModelOptions] = useState<
    { label: string; value: string; disabled?: boolean }[]
  >([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // 从后端API获取模型数据
    const fetchModels = async () => {
      setLoading(true);
      try {
        const models: AiClientModelResponseDTO[] =
          await AiClientModelService.queryEnabledAiClientModels();
        // 转换API数据为Select组件需要的格式，使用modelId和modelUsage
        const options = [
          ...models.map((model) => ({
            label: model.type ? `${model.name} (${model.type})` : model.name,
            value: model.id,
          })),
        ];
        setModelOptions(options);
      } catch (error) {
        console.error('获取模型数据失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchModels();
  }, []);

  return (
    <Field<string> name="inputsValues.name">
      {({ field: nameField }) => (
        <Field<string> name="inputsValues.id">
          {({ field: idField }) => (
            <FormItem name="模型" type="string" required={true} labelWidth={80}>
              <Select
                placeholder={loading ? '加载中...' : '请选择模型'}
                style={{ width: '100%' }}
                value={nameField.value}
                onChange={(value) => {
                  const find = modelOptions.find((option) => option.value === value);
                  if (find) {
                    nameField.onChange(find.label);
                    idField.onChange(find.value);
                  }
                }}
                // disabled={readonly || loading}
                disabled={loading}
                loading={loading}
                optionList={modelOptions}
              />
              <ModelPort data-port-id="model-output" data-port-type="output" />
            </FormItem>
          )}
        </Field>
      )}
    </Field>
  );
}
