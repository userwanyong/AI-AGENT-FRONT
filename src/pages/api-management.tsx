import { useNavigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';

import styled from 'styled-components';
import {
  Layout,
  Table,
  Button,
  Input,
  Space,
  Typography,
  Toast,
  Tag,
  Popconfirm,
  Card,
} from '@douyinfe/semi-ui';
import {
  IconSearch,
  IconEdit,
  IconDelete,
  IconRefresh,
  IconPlus,
} from '@douyinfe/semi-icons';

import { theme } from '../styles/theme';
import {
  aiClientApiAdminService,
  AiClientApiQueryRequestDTO,
  AiClientApiResponseDTO,
} from '../services/ai-client-api-admin-service';
import { Sidebar, Header } from '../components/layout';
import { AiClientApiEditModal } from '../components/ai-client-api-edit-modal';
import { AiClientApiCreateModal } from '../components/ai-client-api-create-modal';

const { Content } = Layout;
const { Title } = Typography;

// 样式组件
const AiClientApiManagementLayout = styled(Layout)`
  min-height: 100vh;
  background: ${theme.colors.bg.secondary};
`;

const MainContent = styled.div<{ $collapsed: boolean }>`
  display: flex;
  flex: 1;
  margin-left: ${(props) => (props.$collapsed ? '80px' : '280px')};
  transition: margin-left ${theme.animation.duration.normal} ${theme.animation.easing.cubic};
`;

const ContentArea = styled(Content)`
  flex: 1;
  padding: 0 0 ${theme.spacing.lg} 0;
  background: ${theme.colors.bg.secondary};
  overflow-y: auto;
`;

const AiClientApiManagementContainer = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
`;

const PageHeader = styled.div`
  padding: ${theme.spacing.lg};
  border-bottom: 1px solid ${theme.colors.border.secondary};
`;

const SearchSection = styled(Card)`
  margin: ${theme.spacing.lg} ${theme.spacing.lg} 0;

  .semi-card-body {
    padding: ${theme.spacing.lg};
  }
`;

const SearchRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.base};
  flex-wrap: wrap;
`;

const TableContainer = styled.div`
  flex: 1;
  margin: 0 ${theme.spacing.lg} ${theme.spacing.lg};
  display: flex;
  flex-direction: column;
`;

const TableCard = styled(Card)`
  flex: 1;
  display: flex;
  flex-direction: column;

  .semi-card-body {
    padding: 0;
    flex: 1;
    display: flex;
    flex-direction: column;
  }
`;

const TableWrapper = styled.div`
  flex: 1;
  overflow: auto;
`;

const ActionButton = styled(Button)`
  margin-right: ${theme.spacing.sm};
`;

export const ApiManagement: React.FC = () => {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dataSource, setDataSource] = useState<AiClientApiResponseDTO[]>([]);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [temp, setTemp] = useState(String);
  const [searchForm, setSearchForm] = useState<AiClientApiQueryRequestDTO>({
    id: '',
    status: undefined,
    pageNum: 1,
    pageSize: 10,
  });
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AiClientApiResponseDTO | null>(null);

  // 表格列定义
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '基础URL',
      dataIndex: 'baseUrl',
      key: 'baseUrl',
      width: 250,
      render: (text: string) => (
        <span
          title={text}
          style={{
            display: 'block',
            maxWidth: '230px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {text}
        </span>
      ),
    },
    {
      title: '对话路径',
      dataIndex: 'completionsPath',
      key: 'completionsPath',
      width: 200,
      render: (text: string) => (
        <span
          title={text}
          style={{
            display: 'block',
            maxWidth: '230px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {text}
        </span>
      ),
    },
    {
      title: '嵌入路径',
      dataIndex: 'embeddingsPath',
      key: 'embeddingsPath',
      width: 150,
      render: (text: string) => (
        <span
          title={text}
          style={{
            display: 'block',
            maxWidth: '230px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {text}
        </span>
      ),
    },
    {
      title: 'API密钥',
      dataIndex: 'apiKey',
      key: 'apiKey',
      width: 100,
      render: (text: string) => (
        <span
          title={text ? `点击复制完整API密钥: ${text}` : '无API密钥'}
          style={{
            display: 'block',
            maxWidth: '180px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            cursor: text ? 'pointer' : 'default',
            color: text ? '#1890ff' : 'inherit',
            textDecoration: text ? 'underline' : 'none',
          }}
          onClick={() => text && handleCopyApiKey(text)}
        >
          {text ? '***' + text.slice(-4) : '-'}
        </span>
      ),
    },

    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: number) => (
        <Tag color={status === 1 ? 'green' : 'red'}>{status === 1 ? '启用' : '禁用'}</Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 180,
      render: (time: string) => new Date(time).toLocaleString(),
    },
    {
      title: '更新时间',
      dataIndex: 'updateTime',
      key: 'updateTime',
      width: 180,
      render: (time: string) => new Date(time).toLocaleString(),
    },
    {
      title: '操作',
      key: 'action',
      width: 190,
      fixed: 'right' as const,
      render: (_: any, record: any) => (
        <Space>
          <ActionButton
            type="primary"
            size="small"
            theme="borderless"
            icon={<IconEdit />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </ActionButton>
          <Popconfirm
            title="确定要删除这个API配置吗？"
            content="删除后无法恢复"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <ActionButton theme="borderless" type="danger" size="small" icon={<IconDelete />}>
              删除
            </ActionButton>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 加载数据
  const loadData = async () => {
    try {
      setLoading(true);
      const response = await aiClientApiAdminService.queryAiClientApiList(searchForm);
      if (response.code === '0000') {
        setDataSource(response.data.items || []);
      } else {
        Toast.error(response.info || '查询失败');
      }
    } catch (error) {
      console.error('查询AI客户端API配置失败:', error);
      Toast.error('查询失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 搜索
  const handleSearch = () => {
    setSearchForm((prev) => ({ ...prev, pageNum: 1 }));
    loadData();
  };

  // 重置搜索
  const handleReset = () => {
    setSearchForm({
      id: '',
      status: undefined,
      pageNum: 1,
      pageSize: 10,
    });
    setTemp(temp + 1);
  };

  // 处理侧边栏导航
  const handleNavigation = (path: string) => {
    switch (path) {
      case 'dashboard':
        navigate('/dashboard');
        break;
      case 'agent-list':
        navigate('/agent-list');
        break;
      case 'agent-config':
        navigate('/agent-config');
        break;
      case 'client-management':
        navigate('/client-management');
        break;
      case 'ai-client-api-management':
        navigate('/ai-client-api-management');
        break;
      case 'advisor-management':
        navigate('/advisor-management');
        break;
      case 'rag-order-management':
        navigate('/rag-order-management');
        break;
      case 'client-model-management':
        navigate('/client-model-management');
        break;
      case 'client-system-prompt-management':
        navigate('/client-system-prompt-management');
        break;
      case 'client-tool-mcp-management':
        navigate('/client-tool-mcp-management');
        break;
      default:
        break;
    }
  };

  // 创建
  const handleCreate = () => {
    setCreateModalVisible(true);
  };

  // 创建成功回调
  const handleCreateSuccess = () => {
    setCreateModalVisible(false);
    loadData();
  };

  // 取消创建
  const handleCreateCancel = () => {
    setCreateModalVisible(false);
  };

  // 编辑
  const handleEdit = (record: AiClientApiResponseDTO) => {
    setEditingRecord(record);
    setModalVisible(true);
  };

  // 模态框成功回调
  const handleModalSuccess = () => {
    setModalVisible(false);
    setEditingRecord(null);
    loadData();
  };

  // 模态框取消回调
  const handleModalCancel = () => {
    setModalVisible(false);
    setEditingRecord(null);
  };

  // 删除
  const handleDelete = async (apiId: string) => {
    try {
      const response = await aiClientApiAdminService.deleteAiClientApiById(apiId);
      if (response.code === '0000') {
        Toast.success('删除成功');
        loadData();
      } else {
        Toast.error(response.info || '删除失败');
      }
    } catch (error) {
      console.error('删除AI客户端API配置失败:', error);
      Toast.error('删除失败，请稍后重试');
    }
  };

  // 复制API密钥
  const handleCopyApiKey = async (apiKey: string) => {
    try {
      await navigator.clipboard.writeText(apiKey);
      Toast.success('API密钥已复制到剪贴板');
    } catch (error) {
      console.error('复制失败:', error);
      // 降级方案：使用传统的复制方法
      try {
        const textArea = document.createElement('textarea');
        textArea.value = apiKey;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        Toast.success('API密钥已复制到剪贴板');
      } catch (fallbackError) {
        console.error('降级复制方案也失败:', fallbackError);
        Toast.error('复制失败，请手动复制');
      }
    }
  };

  // 页面初始化
  useEffect(() => {
    loadData();
  }, []);
  useEffect(() => {
    if (temp) {
      loadData();
    }
  }, [temp]);

  return (
    <AiClientApiManagementLayout>
      <Sidebar
        collapsed={collapsed}
        selectedKey="ai-client-api-management"
        onSelect={handleNavigation}
      />
      <MainContent $collapsed={collapsed}>
        <ContentArea>
          <Header
            collapsed={collapsed}
            onToggleSidebar={() => setCollapsed(!collapsed)}
            onLogout={() => navigate('/login')}
          />
          <AiClientApiManagementContainer>
            <PageHeader>
              <Title heading={3}>API管理</Title>
            </PageHeader>

            <SearchSection>
              <SearchRow>
                <Input
                  placeholder="请输入API ID"
                  value={searchForm.id}
                  onChange={(value) => setSearchForm((prev) => ({ ...prev, id: value }))}
                  style={{ width: 200 }}
                  onEnterPress={handleSearch}
                />
                <Button
                  type="primary"
                  icon={<IconSearch />}
                  onClick={handleSearch}
                  loading={loading}
                >
                  搜索
                </Button>
                <Button icon={<IconRefresh />} onClick={handleReset}>
                  重置
                </Button>
                <Button type="primary" theme="solid" icon={<IconPlus />} onClick={handleCreate}>
                  新增API
                </Button>
              </SearchRow>
            </SearchSection>

            <TableContainer>
              <TableCard>
                <TableWrapper>
                  <Table
                    columns={columns}
                    dataSource={dataSource}
                    loading={loading}
                    pagination={false}
                    scroll={{ x: 1300, y: 'calc(100vh - 400px)' }}
                    rowKey="id"
                  />
                </TableWrapper>
              </TableCard>
            </TableContainer>
          </AiClientApiManagementContainer>
        </ContentArea>
      </MainContent>

      <AiClientApiCreateModal
        visible={createModalVisible}
        onCancel={handleCreateCancel}
        onSuccess={handleCreateSuccess}
      />

      <AiClientApiEditModal
        visible={modalVisible}
        editingRecord={editingRecord}
        onCancel={handleModalCancel}
        onSuccess={handleModalSuccess}
      />
    </AiClientApiManagementLayout>
  );
};
