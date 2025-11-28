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
import { IconSearch, IconPlus, IconEdit, IconDelete, IconRefresh } from '@douyinfe/semi-icons';

import { theme } from '../styles/theme';
import {
  aiClientAdminService,
  AiClientQueryRequestDTO,
  AiClientResponseDTO,
} from '../services/ai-client-admin-service';
import { Sidebar, Header } from '../components/layout';
import { ClientEditModal } from '../components/client-edit-modal';
import { ClientCreateModal } from '../components/client-create-modal';

const { Content } = Layout;
const { Title } = Typography;

// 样式组件
const ClientManagementLayout = styled(Layout)`
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

const ClientManagementContainer = styled.div`
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
  /* 与上方 SearchSection 保持一致的左右间距 */
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

export const ClientManagement: React.FC = () => {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dataSource, setDataSource] = useState<AiClientResponseDTO[]>([]);
  const [searchText, setSearchText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [currentEditClient, setCurrentEditClient] = useState<AiClientResponseDTO | null>(null);

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
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '客户端名称',
      dataIndex: 'name',
      key: 'name',
      width: 180,
      render: (text: string) => (
        <span
          title={text}
          style={{
            display: 'block',
            maxWidth: '200px',
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
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      width: 180,
      render: (text: string) => (
        <span
          title={text}
          style={{
            display: 'block',
            maxWidth: '180px',
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
      width: 150,
      render: (time: string) => new Date(time).toLocaleString(),
    },
    {
      title: '更新时间',
      dataIndex: 'updateTime',
      key: 'updateTime',
      width: 150,
      render: (time: string) => new Date(time).toLocaleString(),
    },
    {
      title: '操作',
      key: 'action',
      width: 130,
      fixed: 'right' as const,
      render: (_: any, record: AiClientResponseDTO) => (
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
            title="确定要删除这个客户端配置吗？"
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

  // 获取客户端列表数据
  const fetchClientList = async () => {
    setLoading(true);
    try {
      const request: AiClientQueryRequestDTO = {
        name: searchText || undefined,
        pageNum: currentPage,
        pageSize: pageSize,
      };

      const result = await aiClientAdminService.queryClientList(request);

      if (result.code === '0000') {
        const data = result.data || [];
        setDataSource(data.items);
        setTotal(data.total);
      } else {
        throw new Error(result.info || '查询失败');
      }
    } catch (error) {
      console.error('获取客户端列表失败:', error);
      Toast.error('获取客户端列表失败');
      setDataSource([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const fetchClientListWithPage = async (pageNum: number, pageSizeParam: number) => {
    setLoading(true);
    try {
      const request: AiClientQueryRequestDTO = {
        name: searchText || undefined,
        pageNum: pageNum, // 使用传入的页码参数
        pageSize: pageSizeParam, // 使用传入的页面大小参数
      };

      const result = await aiClientAdminService.queryClientList(request);

      if (result.code === '0000') {
        const data = result.data || [];
        setDataSource(data.items);
        setTotal(data.total);
      } else {
        throw new Error(result.info || '查询失败');
      }
    } catch (error) {
      console.error('获取客户端列表失败:', error);
      Toast.error('获取客户端列表失败');
      setDataSource([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  // 删除客户端
  const handleDelete = async (record: AiClientResponseDTO) => {
    try {
      const result = await aiClientAdminService.deleteClientById(record.id);

      if (result.code === '0000') {
        Toast.success('删除成功');
        // 重新加载数据
        fetchClientList();
      } else {
        throw new Error(result.info || '删除失败');
      }
    } catch (error) {
      console.error('删除客户端失败:', error);
      Toast.error('删除失败');
    }
  };

  // 编辑客户端
  const handleEdit = (record: AiClientResponseDTO) => {
    setCurrentEditClient(record);
    setEditModalVisible(true);
  };

  // 处理新增客户端
  const handleCreateClient = () => {
    setCreateModalVisible(true);
  };

  // 处理新增成功
  const handleCreateSuccess = () => {
    setCreateModalVisible(false);
    fetchClientList(); // 重新加载数据
  };

  // 处理新增取消
  const handleCreateCancel = () => {
    setCreateModalVisible(false);
  };

  // 处理编辑成功
  const handleEditSuccess = () => {
    setEditModalVisible(false);
    setCurrentEditClient(null);
    fetchClientList(); // 重新加载数据
  };

  // 处理编辑取消
  const handleEditCancel = () => {
    setEditModalVisible(false);
    setCurrentEditClient(null);
  };

  // 搜索
  const handleSearch = () => {
    setCurrentPage(1);
    fetchClientList();
  };

  // 重置搜索
  const handleReset = () => {
    setSearchText('');
    setCurrentPage(1);
    fetchClientList();
  };

  // 分页变化
  const handlePageChange = (page: number, size?: number) => {
    setCurrentPage(page);
    if (size && size !== pageSize) {
      setPageSize(size);
    }
    fetchClientListWithPage(page, size || pageSize);
    // fetchClientList();
  };

  // 组件挂载时获取数据
  // useEffect(() => {
  //   fetchClientList();
  // }, []);
  useEffect(() => {
    if (searchText === '' && currentPage === 1) {
      fetchClientList();
    }
  }, [searchText, currentPage]);

  return (
    <ClientManagementLayout>
      <Sidebar collapsed={collapsed} selectedKey="client-management" onSelect={handleNavigation} />
      <MainContent $collapsed={collapsed}>
        <ContentArea>
          <Header
            collapsed={collapsed}
            onToggleSidebar={() => setCollapsed(!collapsed)}
            onLogout={handleLogout}
          />
          <ClientManagementContainer>
            <PageHeader>
              <Title heading={3} style={{ margin: 0 }}>
                客户端管理
              </Title>
            </PageHeader>

            <SearchSection>
              <SearchRow>
                <Input
                  placeholder="请输入客户端名称"
                  value={searchText}
                  onChange={setSearchText}
                  style={{ width: 200 }}
                  onEnterPress={handleSearch}
                />
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
                  onClick={handleCreateClient}
                >
                  新增客户端
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
                    scroll={{ x: 1400 }}
                    empty={
                      <div style={{ padding: '40px', textAlign: 'center' }}>
                        <Typography.Text type="tertiary">暂无数据</Typography.Text>
                      </div>
                    }
                  />
                </TableWrapper>
              </TableCard>
            </TableContainer>
          </ClientManagementContainer>

          {/* 新增客户端弹窗 */}
          <ClientCreateModal
            visible={createModalVisible}
            onCancel={handleCreateCancel}
            onSuccess={handleCreateSuccess}
          />

          {/* 编辑客户端弹窗 */}
          <ClientEditModal
            visible={editModalVisible}
            clientData={currentEditClient}
            onCancel={handleEditCancel}
            onSuccess={handleEditSuccess}
          />
        </ContentArea>
      </MainContent>
    </ClientManagementLayout>
  );
};
