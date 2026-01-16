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
  Popconfirm,
  Card,
  Switch,
  Dropdown,
  IconButton,
} from '@douyinfe/semi-ui';
import {
  IconSearch,
  IconPlus,
  IconEyeOpened,
  IconEdit,
  IconDelete,
  IconDownload,
  IconMore,
} from '@douyinfe/semi-icons';

import { theme } from '../styles/theme';
import {
  AiAgentDrawService,
  AiAgentDrawConfigResponseDTO,
  AiAgentDrawConfigQueryRequestDTO,
} from '../services/ai-agent-draw-service';
import { AdminUserService } from '../services/admin-user-service';
import { AiAgentService } from '../services';
import { Sidebar, Header } from '../components/layout';

const { Content } = Layout;
const { Title } = Typography;

// 样式组件
const AgentListLayout = styled(Layout)`
  min-height: 100vh;
  background: ${theme.colors.bg.secondary};
`;

const MainContent = styled.div<{ $collapsed: boolean }>`
  display: flex;
  flex: 1;
  margin-left: ${(props) => (props.$collapsed ? '80px' : '245px')};
  transition: margin-left ${theme.animation.duration.normal} ${theme.animation.easing.cubic};
`;

const ContentArea = styled(Content)`
  flex: 1;
  padding: 0 0 ${theme.spacing.lg} 0;
  background: ${theme.colors.bg.secondary};
  overflow-y: auto;
`;

const PageHeader = styled.div`
  margin-top: 14px;
  margin-left: 14px;
  border-bottom: 1px solid ${theme.colors.border.secondary};
  padding-bottom: 14px;
`;

const SearchSection = styled(Card)`
  margin: ${theme.spacing.lg} ${theme.spacing.lg} 0;
  .semi-card-body {
    padding: ${theme.spacing.lg};
  }
`;

const AiAgentManagementContainer = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
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

interface AgentListPageProps {
  selectedKey?: string;
  onMenuSelect?: (key: string) => void;
}

export const AgentListPage: React.FC<AgentListPageProps> = ({
  selectedKey = 'agent-list',
  onMenuSelect,
}) => {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(window.innerWidth <= 768);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

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

  // 处理退出登录
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userInfo');
    localStorage.removeItem('isLoggedIn');
    navigate('/login');
  };
  const [loading, setLoading] = useState(false);
  const [dataSource, setDataSource] = useState<AiAgentDrawConfigResponseDTO[]>([]);
  const [searchParams, setSearchParams] = useState<AiAgentDrawConfigQueryRequestDTO>({
    pageNum: 1,
    pageSize: 10,
  });
  const [total, setTotal] = useState(0);

  // 表格列定义
  const columns = [
    {
      title: '配置ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '配置名称',
      dataIndex: 'name',
      key: 'name',
      width: 120,
      render: (text: string) => (
        <span
          title={text}
          style={{
            display: 'block',
            maxWidth: '120px',
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
      width: 120,
      render: (text: string) => (
        <span
          title={text}
          style={{
            display: 'block',
            maxWidth: '120px',
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
      title: '渠道类型',
      dataIndex: 'channel',
      key: 'channel',
      width: 100,
      render: (text: string) => text || '-',
    },
    {
      title: '执行策略',
      dataIndex: 'strategy',
      key: 'strategy',
      width: 170,
      render: (text: string) => text || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: number, record: AiAgentDrawConfigResponseDTO) => (
        <Switch
          checked={Number(status) === 1}
          size="default"
          onChange={async (checked: boolean) => {
            const newStatus = checked ? 1 : 0;
            try {
              setLoading(true);
              const dto = {
                id: record.id,
                name: record.name,
                description: record.description,
                status: newStatus,
              };
              const res = await AdminUserService.updateAgent(dto);
              if (res && res.code === '0000') {
                Toast.success(`已${checked ? '启用' : '禁用'}`);
                setDataSource((prev) =>
                  prev.map((item) =>
                    item.id === record.id ? { ...item, status: newStatus } : item
                  )
                );
              } else {
                Toast.error(res?.info || '更新失败');
              }
            } catch (error) {
              console.error('更新状态失败:', error);
              Toast.error('更新状态失败');
            } finally {
              setLoading(false);
            }
          }}
        />
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
      width: isMobile ? 80 : 270,
      fixed: isMobile ? undefined : ('right' as const),
      render: (_: any, record: AiAgentDrawConfigResponseDTO) =>
        isMobile ? (
          <Dropdown
            render={
              <Dropdown.Menu>
                <Dropdown.Item onClick={() => handleView(record)}>查看</Dropdown.Item>
                <Dropdown.Item onClick={() => handleEdit(record)}>修改</Dropdown.Item>
                <Dropdown.Item onClick={() => handleLoad(record)}>加载</Dropdown.Item>
                <Dropdown.Item type="danger" onClick={() => handleDelete(record)}>
                  删除
                </Dropdown.Item>
              </Dropdown.Menu>
            }
          >
            <IconButton size="small" type="tertiary" icon={<IconMore />} />
          </Dropdown>
        ) : (
          <Space>
            <ActionButton
              type="tertiary"
              size="small"
              icon={<IconEyeOpened />}
              onClick={() => handleView(record)}
            >
              查看
            </ActionButton>
            <ActionButton
              type="tertiary"
              size="small"
              icon={<IconEdit />}
              onClick={() => handleEdit(record)}
            >
              修改
            </ActionButton>
            <ActionButton
              icon={<IconDownload />}
              type="primary"
              size="small"
              onClick={() => handleLoad(record)}
            >
              加载
            </ActionButton>
            <Popconfirm
              title="确定要删除这个配置吗？"
              content="删除后无法恢复，请谨慎操作"
              onConfirm={() => handleDelete(record)}
            >
              <ActionButton type="danger" size="small" icon={<IconDelete />}>
                删除
              </ActionButton>
            </Popconfirm>
          </Space>
        ),
    },
  ];

  // 加载数据
  const loadData = async (params?: AiAgentDrawConfigQueryRequestDTO) => {
    setLoading(true);
    try {
      const queryParams = { ...searchParams, ...params };
      const result = await AiAgentDrawService.queryDrawConfigList(queryParams);
      if (result.code === '0000') {
        const data = result.data || [];
        setDataSource(data.items);
        setTotal(data.total);
      } else {
        throw new Error(result.info || '查询失败');
      }
    } catch (error) {
      Toast.error('加载数据失败');
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 搜索
  const handleSearch = () => {
    const params = { ...searchParams, pageNum: 1 };
    setSearchParams(params);
    loadData(params);
  };

  // 重置搜索
  const handleReset = () => {
    const params = { id: '', name: '', pageNum: 1, pageSize: 10 };
    setSearchParams(params);
    loadData(params);
  };

  // 分页变化
  const handlePageChange = (pageNum: number, pageSize: number) => {
    const params = { ...searchParams, pageNum, pageSize };
    setSearchParams(params);
    loadData(params);
  };

  // 新建
  const handleCreate = () => {
    // 跳转到 agent-config 页面，新建模式
    navigate('/agent-config');
  };

  // 查看
  const handleView = (record: AiAgentDrawConfigResponseDTO) => {
    // 跳转到 agent-config 页面，传递 configId 参数，并添加 mode=view 表示只读模式
    navigate(`/agent-config?configId=${record.id}&mode=view`);
  };

  // 编辑
  const handleEdit = (record: AiAgentDrawConfigResponseDTO) => {
    // 跳转到 agent-config 页面，传递 configId 参数，默认为编辑模式
    navigate(`/agent-config?configId=${record.id}`);
  };

  // 加载 - 装配智能体
  const handleLoad = async (record: AiAgentDrawConfigResponseDTO) => {
    try {
      setLoading(true);
      // Toast.info(`正在装配智能体: ${record.name}`);

      const result = await AiAgentService.armoryAgent(record.id || '');
      if (result.code === '0000') {
        Toast.success(`智能体 ${record.name} 装配成功！`);
      } else {
        Toast.error(`智能体 ${record.name} 装配失败`);
      }
    } catch (error) {
      console.error('装配智能体失败:', error);
      Toast.error(`装配失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setLoading(false);
    }
  };

  // 删除
  const handleDelete = async (record: AiAgentDrawConfigResponseDTO) => {
    try {
      setLoading(true);
      const success = await AiAgentDrawService.deleteDrawConfig(record.id || '');
      if (success) {
        Toast.success(`删除配置成功`);
        // 重新加载数据
        await loadData();
      } else {
        Toast.error('删除配置失败');
      }
    } catch (error) {
      Toast.error('删除配置失败');
      console.error('删除配置失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 初始化加载数据
  useEffect(() => {
    loadData();
  }, []);
  useEffect(() => {
    if (searchParams.name === '' && searchParams.pageNum === 1 && searchParams.id === '') {
      loadData();
    }
  }, [searchParams.name, searchParams.pageNum, searchParams.id]);

  return (
    <AgentListLayout>
      <Sidebar
        selectedKey={selectedKey}
        onSelect={handleNavigation}
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
      />
      <MainContent $collapsed={collapsed}>
        <ContentArea>
          <Header
            onToggleSidebar={() => setCollapsed(!collapsed)}
            onLogout={handleLogout}
            collapsed={collapsed}
          />
          <AiAgentManagementContainer>
            <PageHeader>
              <Title heading={3}>智能体列表</Title>
            </PageHeader>

            <SearchSection>
              <SearchRow>
                <Input
                  placeholder="请输入配置名称"
                  value={searchParams.name || ''}
                  onChange={(value) => setSearchParams((prev) => ({ ...prev, name: value }))}
                  style={{ width: 200 }}
                  onEnterPress={handleSearch}
                  prefix={<IconSearch />}
                />
                <Input
                  placeholder="请输入智能体ID"
                  value={searchParams.id || ''}
                  onChange={(value) => setSearchParams((prev) => ({ ...prev, id: value }))}
                  style={{ width: 200 }}
                  onEnterPress={handleSearch}
                />
                <Button type="primary" onClick={handleSearch} loading={loading}>
                  搜索
                </Button>
                <Button onClick={handleReset}>重置</Button>
                <div style={{ marginLeft: 'auto' }}>
                  <Button type="primary" icon={<IconPlus />} onClick={handleCreate}>
                    新建
                  </Button>
                </div>
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
                      currentPage: searchParams.pageNum || 1,
                      pageSize: searchParams.pageSize || 10,
                      total: total,
                      onChange: handlePageChange,
                    }}
                    rowKey="id"
                    scroll={{ x: 1500 }}
                    size="middle"
                  />
                </TableWrapper>
              </TableCard>
            </TableContainer>
          </AiAgentManagementContainer>
        </ContentArea>
      </MainContent>
    </AgentListLayout>
  );
};

export default AgentListPage;
