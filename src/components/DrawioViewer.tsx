import React, { useEffect, useRef, useState } from 'react';

import { Button, Toast } from '@douyinfe/semi-ui';
import { IconEdit, IconCopy, IconEyeClosed, IconEyeOpened } from '@douyinfe/semi-icons';

interface DrawioViewerProps {
  xml: string;
}

declare global {
  interface Window {
    GraphViewer: any;
  }
}

export const DrawioViewer: React.FC<DrawioViewerProps> = ({ xml }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (!isVisible || !containerRef.current) return;

    const loadViewer = () => {
      if (window.GraphViewer) {
        renderGraph();
      } else {
        const script = document.createElement('script');
        script.src = 'https://viewer.diagrams.net/js/viewer-static.min.js';
        script.onload = () => {
          renderGraph();
        };
        document.head.appendChild(script);
      }
    };

    const renderGraph = () => {
      if (!containerRef.current || !window.GraphViewer) return;

      containerRef.current.innerHTML = '';
      const graphContainer = document.createElement('div');
      graphContainer.className = 'mxgraph';
      graphContainer.style.maxWidth = '100%';
      graphContainer.style.width = '100%';
      graphContainer.style.border = '1px solid transparent';
      graphContainer.style.overflow = 'visible';

      const config = {
        xml: xml,
        highlight: '#0000ff',
        nav: true,
        resize: true,
        toolbar: null,
        lightbox: true,
        fit: true,
        center: true,
        'allow-zoom-in': true,
        'check-visible-state': false,
        zoom: 1,
        border: 8,
      };

      graphContainer.setAttribute('data-mxgraph', JSON.stringify(config));
      containerRef.current.appendChild(graphContainer);

      // Trigger viewer processing after layout settles for correct sizing on small screens
      window.requestAnimationFrame(() => {
        window.GraphViewer.processElements();
        // 再次触发，规避小屏初次布局未稳定导致的尺寸过小
        setTimeout(() => {
          window.GraphViewer.processElements();
        }, 50);
      });
    };

    loadViewer();
    // 监听尺寸变化，确保布局变化后重新适配
    const ro = new ResizeObserver(() => {
      if (window.GraphViewer && containerRef.current) {
        window.GraphViewer.processElements();
      }
    });
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [xml, isVisible]);

  const handleCopy = () => {
    navigator.clipboard.writeText(xml);
    Toast.success('XML已复制');
  };

  const handleEdit = () => {
    // Open in client mode with protocol=json to support postMessage
    const editorWindow = window.open(
      'https://app.diagrams.net/?client=1&splash=0&proto=json',
      '_blank'
    );

    if (editorWindow) {
      const handleMessage = (event: MessageEvent) => {
        // Check if the message is from the opened window
        if (event.source !== editorWindow) return;

        try {
          const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
          if (data.event === 'init') {
            // Send the XML data to the editor
            editorWindow.postMessage(
              JSON.stringify({
                action: 'load',
                xml: xml,
                autosave: 0,
              }),
              '*'
            );

            // Clean up listener
            window.removeEventListener('message', handleMessage);
          }
        } catch (e) {
          // Ignore non-JSON messages
        }
      };

      window.addEventListener('message', handleMessage);
    }
  };

  if (!isVisible) {
    return (
      <Button icon={<IconEyeOpened />} onClick={() => setIsVisible(true)}>
        显示流程图预览
      </Button>
    );
  }

  return (
    <div
      className="drawio-viewer-container"
      style={{
        border: '1px solid var(--semi-color-border)',
        borderRadius: 8,
        padding: 12,
        marginTop: 12,
        backgroundColor: 'var(--semi-color-bg-1)',
        boxSizing: 'border-box',
      }}
    >
      <div
        className="drawio-toolbar"
        style={{ marginBottom: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}
      >
        <Button size="small" icon={<IconEdit />} onClick={handleEdit}>
          在Draw.io中编辑
        </Button>
        <Button size="small" icon={<IconCopy />} onClick={handleCopy}>
          复制 XML
        </Button>
        <Button size="small" icon={<IconEyeClosed />} onClick={() => setIsVisible(false)}>
          隐藏预览
        </Button>
      </div>
      <div
        ref={containerRef}
        style={{ width: '100%', overflow: 'visible', position: 'relative', maxWidth: '100%' }}
      ></div>
    </div>
  );
};
