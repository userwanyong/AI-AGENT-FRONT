import React, { useState } from 'react';

import {
  Modal,
  Input,
  Select,
  Button,
  Toast,
  Space,
  TextArea,
  Typography,
} from '@douyinfe/semi-ui';

import { aiClientAdminService, AiClientRequestDTO } from '../services/ai-client-admin-service';

interface ClientCreateModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}

interface FormData {
  name: string;
  description: string;
  status: number;
}

export const ClientCreateModal: React.FC<ClientCreateModalProps> = ({
  visible,
  onCancel,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    status: 1,
  });
  const [errors, setErrors] = useState<FormErrors>({});

  interface FormErrors {
    name?: string;
    description?: string;
  }

  // 表单验证
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = '请输入客户端名称';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = '客户端名称至少2个字符';
    } else if (formData.name.trim().length > 50) {
      newErrors.name = '客户端名称不能超过50个字符';
    }

    if (formData.description && formData.description.length > 200) {
      newErrors.description = '描述不能超过200个字符';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 处理表单提交
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const request: AiClientRequestDTO = {
        name: formData.name.trim(),
        description: formData.description.trim() || '',
        status: formData.status,
      };

      const result = await aiClientAdminService.createClient(request);

      if (result.code === '0000') {
        Toast.success('客户端创建成功');
        handleReset();
        onSuccess();
      } else {
        throw new Error(result.info || '创建失败');
      }
    } catch (error) {
      console.error('创建客户端失败:', error);
      Toast.error('创建失败，请检查网络连接或稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 重置表单
  const handleReset = () => {
    setFormData({
      name: '',
      description: '',
      status: 1,
    });
    setErrors({});
  };

  // 处理取消
  const handleCancel = () => {
    handleReset();
    onCancel();
  };

  return (
    <Modal
      title="新增客户端"
      visible={visible}
      onCancel={handleCancel}
      footer={null}
      width={500}
      maskClosable={false}
    >
      <div style={{ padding: '20px 0' }}>
        <div style={{ marginBottom: '16px' }}>
          <Typography.Text strong>
            <span style={{ color: 'red' }}>*</span> 客户端名称
          </Typography.Text>
          <Input
            placeholder="请输入客户端名称"
            value={formData.name}
            onChange={(value: string) => setFormData((prev) => ({ ...prev, name: value }))}
            style={{ marginTop: '8px' }}
          />
          {errors.name && (
            <div style={{ marginLeft: '10px', color: 'red', fontSize: '12px' }}>{errors.name}</div>
          )}
        </div>

        <div>
          <div style={{ marginBottom: '16px' }}>
            <Typography.Text strong>
              <span
                style={{
                  width: '100px',
                  textAlign: 'right',
                  marginRight: '12px',
                  paddingTop: '6px',
                }}
              >
                描述
              </span>
            </Typography.Text>
            <TextArea
              placeholder="请输入客户端描述（可选）"
              value={formData.description}
              onChange={(value: string) => setFormData((prev) => ({ ...prev, description: value }))}
              maxCount={200}
              rows={3}
              style={{ marginTop: '8px' }}
            />
          </div>
          {errors.description && (
            <div style={{ marginLeft: '10px', color: 'red', fontSize: '12px' }}>
              {errors.description}
            </div>
          )}
        </div>

        <div style={{ marginBottom: '16px' }}>
          <Typography.Text strong>
            <span style={{ color: 'red' }}>*</span> 状态
          </Typography.Text>
          <Select
            placeholder="请选择状态"
            value={formData.status}
            onChange={(value) => setFormData((prev) => ({ ...prev, status: value as number }))}
            style={{ width: '100%', marginTop: '8px' }}
          >
            <Select.Option value={1}>启用</Select.Option>
            <Select.Option value={0}>禁用</Select.Option>
          </Select>
        </div>

        <div style={{ textAlign: 'right', marginTop: '20px' }}>
          <Space>
            <Button onClick={handleCancel}>取消</Button>
            <Button type="primary" onClick={handleSubmit} loading={loading}>
              保存
            </Button>
          </Space>
        </div>
      </div>
    </Modal>
  );
};
