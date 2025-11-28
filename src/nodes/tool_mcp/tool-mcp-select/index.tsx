import { useEffect, useState } from 'react';

import { Field } from '@flowgram.ai/free-layout-editor';
import { Select } from '@douyinfe/semi-ui';

import type { AiClientToolMcpResponseDTO } from '../../../services/ai-client-tool-mcp-service';
import { AiClientToolMcpService } from '../../../services';
import { FormItem } from '../../../form-components';

// import { ToolMcpPort } from './styles';

export function ToolMcpSelect() {
  const [toolMcpOptions, setToolMcpOptions] = useState<{ label: string; value: string }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // 从后端API获取工具MCP数据
    const fetchToolMcps = async () => {
      setLoading(true);
      try {
        const toolMcps: AiClientToolMcpResponseDTO[] =
          await AiClientToolMcpService.queryEnableAiClientToolMcps();
        // 转换API数据为Select组件需要的格式，使用mcpId和mcpName
        const options = toolMcps.map((toolMcp) => ({
          label: toolMcp.name,
          value: toolMcp.id,
        }));
        setToolMcpOptions(options);
      } catch (error) {
        console.error('获取工具MCP数据失败:', error);
        // 设置空选项作为降级处理
        setToolMcpOptions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchToolMcps();
  }, []);

  return (
    <Field<string> name="inputsValues.name">
      {({ field: nameField }) => (
        <Field<string> name="inputsValues.id">
          {({ field: idField }) => (
            <FormItem name="MCP" type="string" required={true} labelWidth={80}>
              <Select
                placeholder={loading ? '加载中...' : '请选择MCP'}
                style={{ width: '100%' }}
                value={nameField.value}
                onChange={(value) => {
                  const find = toolMcpOptions.find((option) => option.value === value);
                  if (find) {
                    nameField.onChange(find.label);
                    idField.onChange(find.value);
                  }
                }}
                // disabled={readonly || loading}
                disabled={loading}
                loading={loading}
                optionList={toolMcpOptions}
              />
            </FormItem>
          )}
        </Field>
      )}
    </Field>
  );
}
