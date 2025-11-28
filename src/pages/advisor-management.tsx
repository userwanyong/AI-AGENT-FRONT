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
  Select,
  Modal,
  TextArea,
} from '@douyinfe/semi-ui';
import { IconSearch, IconPlus, IconEdit, IconDelete, IconRefresh } from '@douyinfe/semi-icons';

import { theme } from '../styles/theme';
import {
  aiClientAdvisorAdminService,
  AiClientAdvisorQueryRequestDTO,
  AiClientAdvisorResponseDTO,
  AiClientAdvisorRequestDTO,
} from '../services/ai-advisor-admin-service';
import { Sidebar, Header } from '../components/layout';

const { Content } = Layout;
const { Title } = Typography;
const { Option } = Select;

// 样式组件
const AdvisorManagementLayout = styled(Layout)`
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

const AdvisorManagementContainer = styled.div`
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

export const AdvisorManagement: React.FC = () => {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dataSource, setDataSource] = useState<AiClientAdvisorResponseDTO[]>([]);
  const [searchText, setSearchText] = useState('');
  const [searchType, setSearchType] = useState<string>('');
  const [searchStatus, setSearchStatus] = useState<number | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  // 新增顾问弹窗相关状态
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    name: '',
    type: '',
    orderNum: 1,
    extParam: '',
    status: 1,
  });

  // 编辑顾问弹窗相关状态
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editFormData, setEditFormData] = useState({
    id: '',
    name: '',
    type: '',
    orderNum: 1,
    extParam: '',
    status: 1,
  });

  // 获取用户信息
  // const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');

  // 处理退出登录
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userInfo');
    localStorage.removeItem('isLoggedIn');
    Toast.success('已退出登录');
    navigate('/login');
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
        navigate(path);
        break;
    }
  };

  // 表格列定义
  // 顾问类型展示映射
  const TYPE_LABEL_MAP: Record<string, string> = {
      MessageChatMemoryAdvisor:"内存记忆-历史+用户消息",
      PromptChatMemoryAdvisor:"内存记忆-历史+系统提示词",
      MessageChatMemoryAdvisorRedis:"redis记忆-历史+用户消息",
      PromptChatMemoryAdvisorRedis:"redis记忆-历史+系统提示词",
      SimpleLoggerAdvisor:"日志",
      RagAnswer:"知识库"
  };
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '顾问名称',
      dataIndex: 'name',
      key: 'name',
      width: 180,
      render: (name: string) => (
        <Typography.Text
          ellipsis={{ showTooltip: true }}
          style={{ display: 'block', width: '100%' }}
        >
          {name}
        </Typography.Text>
      ),
    },
    {
      title: '顾问类型',
      dataIndex: 'type',
      key: 'type',
      width: 150,
      render: (type: string) => <Tag color="blue">{TYPE_LABEL_MAP[type] ?? type}</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: number) => (
        <Tag color={status === 1 ? 'green' : 'red'}>{status === 1 ? '启用' : '禁用'}</Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 170,
      render: (time: string) => new Date(time).toLocaleString(),
    },
    {
      title: '更新时间',
      dataIndex: 'updateTime',
      key: 'updateTime',
      width: 170,
      render: (time: string) => new Date(time).toLocaleString(),
    },
    {
      title: '操作',
      key: 'action',
      width: 140,
      fixed: 'right' as const,
      render: (_: any, record: AiClientAdvisorResponseDTO) => (
        <Space>
          <ActionButton
            theme="borderless"
            type="primary"
            icon={<IconEdit />}
            size="small"
            onClick={() => handleEdit(record)}
          >
            编辑
          </ActionButton>
          <Popconfirm
            title="确定要删除这个顾问配置吗？"
            content="删除后无法恢复，请谨慎操作"
            onConfirm={() => handleDelete(record)}
            okText="确定"
            cancelText="取消"
          >
            <ActionButton theme="borderless" type="danger" icon={<IconDelete />} size="small">
              删除
            </ActionButton>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const fetchAdvisorListWithPage = async (pageNum: number, pageSizeParam: number) => {
    setLoading(true);
    try {
      const request: AiClientAdvisorQueryRequestDTO = {
        name: searchText || undefined,
        type: searchType || undefined,
        status: searchStatus,
        pageNum: pageNum,
        pageSize: pageSizeParam,
      };

      const result = await aiClientAdvisorAdminService.queryAdvisorList(request);

      if (result.code === '0000') {
        const data = result.data || [];
        setDataSource(data.items);
        setTotal(data.total);
      } else {
        throw new Error(result.info || '查询失败');
      }
    } catch (error) {
      console.error('获取顾问列表失败:', error);
      Toast.error('获取顾问列表失败');
      setDataSource([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  // 获取顾问列表数据
  const fetchAdvisorList = async () => {
    setLoading(true);
    try {
      const request: AiClientAdvisorQueryRequestDTO = {
        name: searchText || undefined,
        type: searchType || undefined,
        status: searchStatus,
        pageNum: currentPage,
        pageSize: pageSize,
      };

      const result = await aiClientAdvisorAdminService.queryAdvisorList(request);

      if (result.code === '0000') {
        const data = result.data || [];
        setDataSource(data.items);
        setTotal(data.total);
      } else {
        throw new Error(result.info || '查询失败');
      }
    } catch (error) {
      console.error('获取顾问列表失败:', error);
      Toast.error('获取顾问列表失败');
      setDataSource([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  // 删除顾问
  const handleDelete = async (record: AiClientAdvisorResponseDTO) => {
    try {
      const result = await aiClientAdvisorAdminService.deleteAdvisorById(record.id);

      if (result.code === '0000') {
        Toast.success('删除成功');
        // 重新加载数据
        fetchAdvisorList();
      } else {
        throw new Error(result.info || '删除失败');
      }
    } catch (error) {
      console.error('删除顾问失败:', error);
      Toast.error('删除失败，请检查网络连接');
    }
  };

  // 编辑顾问
  const handleEdit = (record: AiClientAdvisorResponseDTO) => {
    setEditFormData({
      id: record.id,
      name: record.name,
      type: record.type,
      orderNum: record.orderNum || 1,
      extParam: record.extParam || '{}',
      status: record.status,
    });
    setEditModalVisible(true);
  };

  // 打开新增顾问弹窗
  const handleOpenCreateModal = () => {
    setCreateFormData({
      name: '',
      type: '',
      orderNum: 1,
      extParam: '',
      status: 1,
    });
    setCreateModalVisible(true);
  };

  // 关闭新增顾问弹窗
  const handleCloseCreateModal = () => {
    setCreateModalVisible(false);
    setCreateFormData({
      name: '',
      type: '',
      orderNum: 1,
      extParam: '',
      status: 1,
    });
  };

  // 关闭编辑顾问弹窗
  const handleCloseEditModal = () => {
    setEditModalVisible(false);
    setEditFormData({
      id: '',
      name: '',
      type: '',
      orderNum: 1,
      extParam: '',
      status: 1,
    });
  };

  // 更新顾问
  const handleUpdateAdvisor = async () => {
    // 表单验证
    if (!editFormData.name.trim()) {
      Toast.error('请输入顾问名称');
      return;
    }
    if (!editFormData.type.trim()) {
      Toast.error('请输入顾问类型');
      return;
    }

    setEditLoading(true);
    try {
      const request: AiClientAdvisorRequestDTO = {
        id: editFormData.id,
        name: editFormData.name.trim(),
        type: editFormData.type.trim(),
        orderNum: editFormData.orderNum,
        extParam: editFormData.extParam.trim() || '{}',
        status: editFormData.status,
      };

      const result = await aiClientAdvisorAdminService.updateAdvisorById(request);

      if (result.code === '0000') {
        Toast.success('更新顾问成功');
        handleCloseEditModal();
        // 重新加载数据
        fetchAdvisorList();
      } else {
        throw new Error(result.info || '更新失败');
      }
    } catch (error) {
      console.error('更新顾问失败:', error);
      Toast.error('更新失败，请检查网络连接');
    } finally {
      setEditLoading(false);
    }
  };

  // 创建顾问
  const handleCreateAdvisor = async () => {
    // 表单验证
    if (!createFormData.name.trim()) {
      Toast.error('请输入顾问名称');
      return;
    }
    if (!createFormData.type.trim()) {
      Toast.error('请输入顾问类型');
      return;
    }

    setCreateLoading(true);
    try {
      const request: AiClientAdvisorRequestDTO = {
        name: createFormData.name.trim(),
        type: createFormData.type.trim(),
        orderNum: createFormData.orderNum,
        extParam: createFormData.extParam.trim() || '{}',
        status: createFormData.status,
      };

      const result = await aiClientAdvisorAdminService.createAdvisor(request);

      if (result.code === '0000') {
        Toast.success('创建顾问成功');
        handleCloseCreateModal();
        // 重新加载数据
        fetchAdvisorList();
      } else {
        throw new Error(result.info || '创建失败');
      }
    } catch (error) {
      console.error('创建顾问失败:', error);
      Toast.error('创建失败，请检查网络连接');
    } finally {
      setCreateLoading(false);
    }
  };

  // 搜索
  const handleSearch = () => {
    setCurrentPage(1);
    fetchAdvisorList();
  };

  // 重置搜索
  const handleReset = () => {
    setSearchText('');
    setSearchType('');
    setSearchStatus(undefined);
    setCurrentPage(1);
    fetchAdvisorList();
  };

  // 分页变化
  const handlePageChange = (page: number, size?: number) => {
    setCurrentPage(page);
    if (size && size !== pageSize) {
      setPageSize(size);
    }
    fetchAdvisorListWithPage(page, size || pageSize);
    // fetchAdvisorList();
  };

  // 组件挂载时获取数据
  // useEffect(() => {
  //   fetchAdvisorList();
  // }, []);
  useEffect(() => {
    if (searchText === '' && currentPage === 1 && searchType === '' && searchStatus === undefined) {
      fetchAdvisorList();
    }
  }, [searchText, searchType, searchStatus, currentPage]);

  return (
    <AdvisorManagementLayout>
      <Sidebar collapsed={collapsed} selectedKey="advisor-management" onSelect={handleNavigation} />
      <MainContent $collapsed={collapsed}>
        <ContentArea>
          <Header
            collapsed={collapsed}
            onToggleSidebar={() => setCollapsed(!collapsed)}
            onLogout={handleLogout}
          />
          <AdvisorManagementContainer>
            <PageHeader>
              <Title heading={3} style={{ margin: 0 }}>
                顾问管理
              </Title>
            </PageHeader>

            <SearchSection>
              <SearchRow>
                <Input
                  placeholder="请输入顾问名称"
                  value={searchText}
                  onChange={setSearchText}
                  style={{ width: 200 }}
                  onEnterPress={handleSearch}
                />
                <Input
                  placeholder="请输入顾问类型"
                  value={searchType}
                  onChange={setSearchType}
                  style={{ width: 200 }}
                  onEnterPress={handleSearch}
                />
                <Select
                  placeholder="选择状态"
                  value={searchStatus}
                  onChange={(value) => setSearchStatus(value as number | undefined)}
                  style={{ width: 120 }}
                >
                  <Option value={1}>启用</Option>
                  <Option value={0}>禁用</Option>
                </Select>
                <Button type="primary" icon={<IconSearch />} onClick={handleSearch}>
                  搜索
                </Button>
                <Button icon={<IconRefresh />} onClick={handleReset}>
                  重置
                </Button>
                <Button
                  type="primary"
                  theme="solid"
                  icon={<IconPlus />}
                  onClick={handleOpenCreateModal}
                >
                  新增顾问
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
                    pagination={{
                      currentPage: currentPage,
                      pageSize: pageSize,
                      total: total,
                      showSizeChanger: true,
                      showQuickJumper: true,
                      onChange: handlePageChange,
                    }}
                    rowKey="id"
                    scroll={{ x: 1200 }}
                    empty={
                      <div style={{ padding: '40px', textAlign: 'center' }}>
                        <Typography.Text type="tertiary">暂无数据</Typography.Text>
                      </div>
                    }
                  />
                </TableWrapper>
              </TableCard>
            </TableContainer>
          </AdvisorManagementContainer>
        </ContentArea>
      </MainContent>

      {/* 新增顾问弹窗 */}
      <Modal
        title="新增顾问"
        visible={createModalVisible}
        onOk={handleCreateAdvisor}
        onCancel={handleCloseCreateModal}
        confirmLoading={createLoading}
        width={600}
        okText="确定"
        cancelText="取消"
      >
        <div style={{ padding: '20px 0' }}>
          <div style={{ marginBottom: '16px' }}>
            <Typography.Text strong>
              <span style={{ color: 'red' }}>*</span> 顾问名称
            </Typography.Text>
            <Input
              placeholder="请输入顾问名称"
              value={createFormData.name}
              onChange={(value) => setCreateFormData((prev) => ({ ...prev, name: value }))}
              style={{ marginTop: '8px' }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <Typography.Text strong>
              <span style={{ color: 'red' }}>*</span> 顾问类型
            </Typography.Text>
            <Select
              placeholder="请选择顾问类型"
              value={createFormData.type}
              onChange={(value) =>
                setCreateFormData((prev) => ({ ...prev, type: value as string }))
              }
              style={{ width: '100%', marginTop: '8px' }}
            >
              <Option value="MessageChatMemoryAdvisor">内存记忆-历史+用户消息</Option>
              <Option value="PromptChatMemoryAdvisor">内存记忆-历史+系统提示词</Option>
              <Option value="MessageChatMemoryAdvisorRedis">redis记忆-历史+用户消息</Option>
              <Option value="PromptChatMemoryAdvisorRedis">redis记忆-历史+系统提示词</Option>
              <Option value="SimpleLoggerAdvisor">日志</Option>
              <Option value="RagAnswer">知识库</Option>
            </Select>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <Typography.Text strong>顺序号</Typography.Text>
            <Input
              type="number"
              placeholder="请输入顺序号"
              value={createFormData.orderNum.toString()}
              onChange={(value) =>
                setCreateFormData((prev) => ({ ...prev, orderNum: parseInt(value) || 1 }))
              }
              style={{ marginTop: '8px' }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <Typography.Text strong>扩展参数</Typography.Text>
            <TextArea
              placeholder="请输入JSON格式的扩展参数，如：{}"
              value={createFormData.extParam}
              onChange={(value) => setCreateFormData((prev) => ({ ...prev, extParam: value }))}
              rows={4}
              style={{ marginTop: '8px' }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <Typography.Text strong>
              <span style={{ color: 'red' }}>*</span> 状态
            </Typography.Text>
            <Select
              value={createFormData.status}
              onChange={(value) =>
                setCreateFormData((prev) => ({ ...prev, status: value as number }))
              }
              style={{ width: '100%', marginTop: '8px' }}
            >
              <Option value={1}>启用</Option>
              <Option value={0}>禁用</Option>
            </Select>
          </div>
        </div>
      </Modal>

      {/* 编辑顾问弹窗 */}
      <Modal
        title="编辑顾问"
        visible={editModalVisible}
        onOk={handleUpdateAdvisor}
        onCancel={handleCloseEditModal}
        confirmLoading={editLoading}
        width={600}
        okText="确定"
        cancelText="取消"
      >
        <div style={{ padding: '20px 0' }}>
          <div style={{ marginBottom: '16px' }}>
            {/*<Typography.Text strong>顾问ID</Typography.Text>*/}
            <Input value={editFormData.id} disabled style={{ marginTop: '8px', display: 'none' }} />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <Typography.Text strong>
              <span style={{ color: 'red' }}>*</span> 顾问名称
            </Typography.Text>
            <Input
              placeholder="请输入顾问名称"
              value={editFormData.name}
              onChange={(value) => setEditFormData((prev) => ({ ...prev, name: value }))}
              style={{ marginTop: '8px' }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <Typography.Text strong>
              <span style={{ color: 'red' }}>*</span> 顾问类型
            </Typography.Text>
            <Select
              placeholder="请选择顾问类型"
              value={editFormData.type}
              onChange={(value) =>
                setEditFormData((prev) => ({ ...prev, type: value as string }))
              }
              style={{ width: '100%', marginTop: '8px' }}
            >
              <Option value="MessageChatMemoryAdvisor">内存记忆-历史+用户消息</Option>
              <Option value="PromptChatMemoryAdvisor">内存记忆-历史+系统提示词</Option>
              <Option value="MessageChatMemoryAdvisorRedis">redis记忆-历史+用户消息</Option>
              <Option value="PromptChatMemoryAdvisorRedis">redis记忆-历史+系统提示词</Option>
              <Option value="SimpleLoggerAdvisor">日志</Option>
              <Option value="RagAnswer">知识库</Option>
            </Select>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <Typography.Text strong>顺序号</Typography.Text>
            <Input
              type="number"
              placeholder="请输入顺序号"
              value={editFormData.orderNum.toString()}
              onChange={(value) =>
                setEditFormData((prev) => ({ ...prev, orderNum: parseInt(value) || 1 }))
              }
              style={{ marginTop: '8px' }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <Typography.Text strong>扩展参数</Typography.Text>
            <TextArea
              placeholder="请输入JSON格式的扩展参数，如：{}"
              value={editFormData.extParam}
              onChange={(value) => setEditFormData((prev) => ({ ...prev, extParam: value }))}
              rows={4}
              style={{ marginTop: '8px' }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <Typography.Text strong>
              <span style={{ color: 'red' }}>*</span> 状态
            </Typography.Text>
            <Select
              value={editFormData.status}
              onChange={(value) =>
                setEditFormData((prev) => ({ ...prev, status: value as number }))
              }
              style={{ width: '100%', marginTop: '8px' }}
            >
              <Option value={1}>启用</Option>
              <Option value={0}>禁用</Option>
            </Select>
          </div>
        </div>
      </Modal>
    </AdvisorManagementLayout>
  );
};
