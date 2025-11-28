import { useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';

import { EditorRenderer, FreeLayoutEditorProvider } from '@flowgram.ai/free-layout-editor';
import { Toast, Spin } from '@douyinfe/semi-ui';

import '@flowgram.ai/free-layout-editor/index.css';
import './styles/index.css';
import { getUrlParam } from './utils/url';
import { FlowDocumentJSON } from './typings';
import { AiAgentDrawService } from './services';
import { nodeRegistries } from './nodes';
import { initialData } from './initial-data';
import { useEditorProps } from './hooks';
import { ReadOnlyTools, Tools } from './components/tools';
import { SidebarProvider, SidebarRenderer } from './components/sidebar';

export const Editor = () => {
  const [editorData, setEditorData] = useState<FlowDocumentJSON>(initialData);
  const [loading, setLoading] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const location = useLocation();
  const editorProps = useEditorProps(editorData, nodeRegistries);

  useEffect(() => {
    const configId = getUrlParam('configId');
    if (getUrlParam('mode') === 'view') {
      setIsReadOnly(true);
    }

    if (configId) {
      setLoading(true);

      AiAgentDrawService.getDrawConfig(configId)
        .then((response) => {
          if (response && response.data) {
            try {
              const parsedData = JSON.parse(response.data);

              setEditorData(parsedData);
              Toast.success('配置数据加载成功');
            } catch (error) {
              Toast.error('配置数据格式错误');
              setEditorData(initialData);
            }
          } else {
            Toast.warning('未找到配置数据，使用默认配置');
            setEditorData(initialData);
          }
        })
        .catch((error) => {
          Toast.error('加载配置数据失败');
          setEditorData(initialData);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setEditorData(initialData);
    }
  }, [location.search]);

  if (loading) {
    return (
      <div
        className="doc-free-feature-overview"
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
        }}
      >
        <Spin style={{ marginTop: '100px', width: '100%' }} size="large" tip="正在加载..." />
      </div>
    );
  }

  return (
    <div className="doc-free-feature-overview">
      <FreeLayoutEditorProvider {...editorProps}>
        <SidebarProvider>
          <div className="demo-container">
            <EditorRenderer className="demo-editor" />
          </div>
          {!isReadOnly && <Tools />}
          {isReadOnly && <ReadOnlyTools />}
          <SidebarRenderer />
        </SidebarProvider>
      </FreeLayoutEditorProvider>
    </div>
  );
};
