import { useEffect, useState } from 'react';

import { Field } from '@flowgram.ai/free-layout-editor';
import { Select } from '@douyinfe/semi-ui';

import type { AiClientAdvisorResponseDTO } from '../../../services/ai-client-advisor-service';
import { AiClientAdvisorService } from '../../../services';
import { FormItem } from '../../../form-components';

export function AdvisorSelect() {
  const [advisorOptions, setAdvisorOptions] = useState<{ label: string; value: string }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // 从后端API获取顾问数据
    const fetchAdvisors = async () => {
      setLoading(true);
      try {
        const advisors: AiClientAdvisorResponseDTO[] =
          await AiClientAdvisorService.queryEnableAiClientAdvisors();
        // 转换API数据为Select组件需要的格式，使用advisorId和advisorName
        const options = advisors.map((advisor) => ({
          label: advisor.name,
          value: advisor.id,
        }));
        setAdvisorOptions(options);
      } catch (error) {
        console.error('获取顾问数据失败:', error);
        // 设置空选项作为降级处理
        setAdvisorOptions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAdvisors();
  }, []);

  return (
    <Field<string> name="inputsValues.name">
      {({ field: nameField }) => (
        <Field<string> name="inputsValues.id">
          {({ field: idField }) => (
            <FormItem name="顾问角色" type="string" required={true} labelWidth={80}>
              <Select
                placeholder={loading ? '加载中...' : '请选择顾问角色'}
                style={{ width: '100%' }}
                value={nameField.value}
                onChange={(value) => {
                  const find = advisorOptions.find((option) => option.value === value);
                  if (find) {
                    nameField.onChange(find.label);
                    idField.onChange(find.value);
                  }
                }}
                // disabled={readonly || loading}
                disabled={loading}
                loading={loading}
                optionList={advisorOptions}
              />
            </FormItem>
          )}
        </Field>
      )}
    </Field>
  );
}
