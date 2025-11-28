import React, { useState, useEffect } from 'react';

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

import {
  aiClientAdminService,
  AiClientRequestDTO,
  AiClientResponseDTO,
} from '../services/ai-client-admin-service';

interface ClientEditModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  clientData: AiClientResponseDTO | null;
}

interface FormData {
  id: string;
  name: string;
  description: string;
  status: number;
}

interface FormErrors {
  name?: string;
  description?: string;
}

export const ClientEditModal: React.FC<ClientEditModalProps> = ({
  visible,
  onCancel,
  onSuccess,
  clientData,
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    id: '0',
    name: '',
    description: '',
    status: 1,
  });
  const [errors, setErrors] = useState<FormErrors>({});

  // 当弹窗打开且有客户端数据时，初始化表单
  useEffect(() => {
    if (visible && clientData) {
      setFormData({
        id: clientData.id,
        name: clientData.name,
        description: clientData.description || '',
        status: clientData.status,
      });
      setErrors({});
    }
  }, [visible, clientData]);

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
        id: formData.id,
        name: formData.name.trim(),
        description: formData.description.trim() || '',
        status: formData.status,
      };

      const result = await aiClientAdminService.updateClientById(request);

      if (result.code === '0000') {
        Toast.success('客户端更新成功');
        handleReset();
        onSuccess();
      } else {
        throw new Error(result.info || '更新失败');
      }
    } catch (error) {
      console.error('更新客户端失败:', error);
      Toast.error('更新失败，请检查网络连接或稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 重置表单
  const handleReset = () => {
    setFormData({
      id: '0',
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
      title="编辑客户端"
      visible={visible}
      onCancel={handleCancel}
      footer={null}
      width={500}
      maskClosable={false}
    >
      <div style={{ padding: '20px 0' }}>
        <div style={{ marginBottom: '16px' }}>
          <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
            {/*<span style={{ width: '100px', textAlign: 'right', marginRight: '12px' }}>*/}
            {/*  客户端ID:*/}
            {/*</span>*/}
            <Input value={formData.id} disabled style={{ flex: 1, display: 'none' }} />
          </div>
        </div>

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

        <div style={{ marginBottom: '16px' }}>
          <Typography.Text strong>
            <span
              style={{ width: '100px', textAlign: 'right', marginRight: '12px', paddingTop: '6px' }}
            >
              客户端描述
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
