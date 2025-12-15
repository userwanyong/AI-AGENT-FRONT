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
  Modal,
  Select,
  Dropdown,
  IconButton,
} from '@douyinfe/semi-ui';
import {
  IconSearch,
  IconPlus,
  IconEdit,
  IconDelete,
  IconRefresh,
  IconMore,
} from '@douyinfe/semi-icons';

import { theme } from '../styles/theme';
import {
  aiClientModelAdminService,
  AiClientModelQueryRequestDTO,
  AiClientModelResponseDTO,
  AiClientModelRequestDTO,
} from '../services/ai-model-admin-service';
import {
  aiClientApiAdminService,
  AiClientApiResponseDTO,
} from '../services/ai-client-api-admin-service';
import { Sidebar, Header } from '../components/layout';

const { Content } = Layout;
const { Title } = Typography;

// 样式组件
const ModelManagementLayout = styled(Layout)`
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

const ModelManagementContainer = styled.div`
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

const FormRow = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 16px;

  label {
    width: 100px;
    text-align: right;
    margin-right: 12px;
    font-weight: 500;
  }

  .form-control {
    flex: 1;
  }
`;

export const ModelManagement: React.FC = () => {
  const navigate = useNavigate();

  // 侧边栏状态
  const [sidebarCollapsed, setSidebarCollapsed] = useState(window.innerWidth <= 768);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // 表格数据状态
  const [modelList, setModelList] = useState<AiClientModelResponseDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  // 搜索状态
  const [searchText, setSearchText] = useState('');
  const [searchStatus, setSearchStatus] = useState<number | undefined>(undefined);

  // 模态框状态
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AiClientModelResponseDTO | null>(null);

  // 表单数据
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    type: '',
    chatApiId: '',
    status: 1,
  });

  // 可用API（用于动态获取 API ID 下拉）
  const [enabledApis, setEnabledApis] = useState<AiClientApiResponseDTO[]>([]);
  const apiIdOptions = React.useMemo(() => {
    const seen = new Set<string>();
    const opts: { id: string; label: string }[] = [];
    enabledApis.forEach((api) => {
      const id = api.id;
      if (id && !seen.has(id)) {
        seen.add(id);
        const label = `${id}-${api.baseUrl}`; // id-url 展示
        opts.push({ id, label });
      }
    });
    return opts;
  }, [enabledApis]);

  // 表格列定义
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '模型标识',
      dataIndex: 'name',
      key: 'name',
      width: 180,
    },
    {
      title: '模型备注',
      dataIndex: 'type',
      key: 'type',
      width: 200,
    },
    {
      title: 'API ID',
      dataIndex: 'chatApiId',
      key: 'chatApiId',
      width: 80,
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
      width: isMobile ? 80 : 140,
      fixed: isMobile ? undefined : ('right' as const),
      render: (_: any, record: AiClientModelResponseDTO) =>
        isMobile ? (
          <Dropdown
            render={
              <Dropdown.Menu>
                <Dropdown.Item onClick={() => handleEdit(record)}>编辑</Dropdown.Item>
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
              theme="borderless"
              type="primary"
              icon={<IconEdit />}
              size="small"
              onClick={() => handleEdit(record)}
            >
              编辑
            </ActionButton>
            <Popconfirm
              title="确定要删除这个模型配置吗？"
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

  // 获取模型列表数据
  const fetchModelList = async () => {
    setLoading(true);
    try {
      const request: AiClientModelQueryRequestDTO = {
        name: searchText || undefined,
        status: searchStatus,
        pageNum: currentPage,
        pageSize: pageSize,
      };

      const result = await aiClientModelAdminService.queryAiClientModelList(request);

      if (result.code === '0000' && result.data) {
        setModelList(result.data.items);
        setTotal(result.data.total);
      } else {
        throw new Error(result.info || '获取数据失败');
      }
    } catch (error) {
      console.error('获取模型列表失败:', error);
      Toast.error('获取数据失败，请稍后重试');
      setModelList([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const fetchModelListWithPage = async (pageNum: number, pageSizeParam: number) => {
    setLoading(true);
    try {
      const request: AiClientModelQueryRequestDTO = {
        name: searchText || undefined,
        status: searchStatus,
        pageNum: pageNum,
        pageSize: pageSizeParam,
      };

      const result = await aiClientModelAdminService.queryAiClientModelList(request);

      if (result.code === '0000' && result.data) {
        setModelList(result.data.items);
        setTotal(result.data.total);
      } else {
        throw new Error(result.info || '获取数据失败');
      }
    } catch (error) {
      console.error('获取模型列表失败:', error);
      Toast.error('获取数据失败，请稍后重试');
      setModelList([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  // 搜索
  const handleSearch = () => {
    setCurrentPage(1);
    fetchModelList();
  };

  // 重置搜索
  const handleReset = () => {
    setSearchText('');
    setSearchStatus(undefined);
    setCurrentPage(1);
    fetchModelList();
  };

  // 编辑模型
  const handleEdit = (record: AiClientModelResponseDTO) => {
    setEditingRecord(record);
    setFormData({
      id: record.id,
      name: record.name,
      type: record.type || '',
      chatApiId: record.chatApiId || '',
      status: record.status,
    });
    setModalVisible(true);
  };

  // 新增模型
  const handleAdd = () => {
    setEditingRecord(null);
    setFormData({
      id: '',
      name: '',
      type: '',
      chatApiId: '',
      status: 1,
    });
    setModalVisible(true);
  };

  // 删除模型
  const handleDelete = async (record: AiClientModelResponseDTO) => {
    try {
      const result = await aiClientModelAdminService.deleteAiClientModelById(record.id);

      if (result.code === '0000') {
        Toast.success('删除成功');
        fetchModelList();
      } else {
        throw new Error(result.info || '删除失败');
      }
    } catch (error) {
      console.error('删除模型失败:', error);
      Toast.error('删除失败，请稍后重试');
    }
  };

  // 保存模型
  const handleSave = async () => {
    try {
      // 简单验证
      if (!formData.name) {
        Toast.error('请填写必填字段');
        return;
      }

      const request: AiClientModelRequestDTO = {
        ...formData,
        id: editingRecord?.id,
      };

      let result;
      if (editingRecord) {
        // 更新
        result = await aiClientModelAdminService.updateAiClientModelById(request);
      } else {
        // 新增
        result = await aiClientModelAdminService.createAiClientModel(request);
      }

      if (result.code === '0000') {
        Toast.success(editingRecord ? '更新成功' : '创建成功');
        setModalVisible(false);
        fetchModelList();
      } else {
        throw new Error(result.info || '保存失败');
      }
    } catch (error) {
      console.error('保存模型失败:', error);
      Toast.error('保存失败，请检查输入信息');
    }
  };

  // 分页变化
  const handlePageChange = (page: number, size: number) => {
    setCurrentPage(page);
    setPageSize(size);
    fetchModelListWithPage(page, size || pageSize);
  };

  // 初始化数据
  // useEffect(() => {
  //   fetchModelList();
  // }, []);
  // 拉取可用 API 列表，用于 API ID 下拉选项
  useEffect(() => {
    (async () => {
      try {
        const res = await aiClientApiAdminService.queryAiEnableClientApiList();
        if (res.code === '0000') {
          setEnabledApis(res.data || []);
        } else {
          throw new Error(res.info || '查询可用API失败');
        }
      } catch (e) {
        console.error('获取可用API失败:', e);
        Toast.error('获取可用API失败');
        setEnabledApis([]);
      }
    })();
  }, []);
  useEffect(() => {
    if (searchText === '' && currentPage === 1 && searchStatus === undefined) {
      fetchModelList();
    }
  }, [searchText, searchStatus, currentPage]);

  return (
    <ModelManagementLayout>
      <Sidebar
        collapsed={sidebarCollapsed}
        selectedKey="client-model-management"
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        onSelect={(key) => {
          switch (key) {
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
              navigate(`/${key}`);
              break;
          }
        }}
      />

      <MainContent $collapsed={sidebarCollapsed}>
        <ContentArea>
          <Header
            collapsed={sidebarCollapsed}
            onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
            onLogout={() => {
              localStorage.removeItem('userInfo');
              localStorage.removeItem('token');
              navigate('/login');
            }}
          />

          <ModelManagementContainer>
            <PageHeader>
              <Title heading={3}>模型管理</Title>
            </PageHeader>

            {/* 搜索区域 */}
            <SearchSection>
              <SearchRow>
                <Input
                  placeholder="请输入模型名称"
                  value={searchText}
                  onChange={setSearchText}
                  style={{ width: 200 }}
                  prefix={<IconSearch />}
                  onEnterPress={handleSearch}
                />
                <Select
                  placeholder="请选择状态"
                  value={searchStatus}
                  onChange={(value) => setSearchStatus(value as number | undefined)}
                  style={{ width: 120 }}
                >
                  <Select.Option value="1">启用</Select.Option>
                  <Select.Option value="0">禁用</Select.Option>
                </Select>
                <Button type="primary" icon={<IconSearch />} onClick={handleSearch}>
                  搜索
                </Button>
                <Button icon={<IconRefresh />} onClick={handleReset}>
                  重置
                </Button>
                <Button type="primary" theme="solid" icon={<IconPlus />} onClick={handleAdd}>
                  新增模型
                </Button>
              </SearchRow>
            </SearchSection>

            {/* 表格区域 */}
            <TableContainer>
              <TableCard>
                <TableWrapper>
                  <Table
                    columns={columns}
                    dataSource={modelList}
                    loading={loading}
                    pagination={{
                      currentPage: currentPage,
                      pageSize: pageSize,
                      total: total,
                      onChange: handlePageChange,
                    }}
                    scroll={{ x: 1200 }}
                    rowKey="id"
                  />
                </TableWrapper>
              </TableCard>
            </TableContainer>
          </ModelManagementContainer>
        </ContentArea>
      </MainContent>

      {/* 新增/编辑模态框 */}
      <Modal
        title={editingRecord ? '编辑模型配置' : '新增模型配置'}
        visible={modalVisible}
        onOk={handleSave}
        onCancel={() => setModalVisible(false)}
        width={600}
        okText="保存"
        cancelText="取消"
      >
        <FormRow>
          <label>
            <span style={{ color: 'red' }}>*</span> 模型标识
          </label>
          <Input
            className="form-control"
            placeholder="请填写模型标识"
            value={formData.name}
            onChange={(value) => setFormData({ ...formData, name: value })}
          />
        </FormRow>

        <FormRow>
          <label>
            <span style={{ color: 'red' }}>*</span> 模型备注
          </label>
          <Input
            className="form-control"
            placeholder="请输入模型备注"
            value={formData.type}
            onChange={(value) => setFormData({ ...formData, type: value })}
          />
        </FormRow>

        <FormRow>
          <label>
            <span style={{ color: 'red' }}>*</span> API ID
          </label>
          <Select
            className="form-control"
            placeholder="请选择API ID"
            value={formData.chatApiId}
            onChange={(value) => setFormData({ ...formData, chatApiId: value as string })}
            filter
          >
            {apiIdOptions.length === 0 ? (
              <Select.Option value="" disabled>
                暂无可选 API ID
              </Select.Option>
            ) : (
              apiIdOptions.map((opt) => (
                <Select.Option key={opt.id} value={opt.id}>
                  {opt.label}
                </Select.Option>
              ))
            )}
          </Select>
        </FormRow>

        <FormRow>
          <label>
            <span style={{ color: 'red' }}>*</span> 状态
          </label>
          <Select
            className="form-control"
            placeholder="选择状态"
            value={formData.status}
            onChange={(value) => setFormData({ ...formData, status: value as number })}
          >
            <Select.Option value={1}>启用</Select.Option>
            <Select.Option value={0}>禁用</Select.Option>
          </Select>
        </FormRow>
      </Modal>
    </ModelManagementLayout>
  );
};
