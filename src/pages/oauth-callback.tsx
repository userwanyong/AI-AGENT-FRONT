import { useNavigate } from 'react-router-dom';
import React, { useEffect, useRef, useState } from 'react';

import styled from 'styled-components';
import { Toast } from '@douyinfe/semi-ui';

import { UserService } from '../services';

/**
 * OAuth 登录回调页
 *
 * 后端在 OAuth 提供方回调完成后 302 到本页，令牌通过 URL hash 携带：
 * /oauth/callback#accessToken=xxx&refreshToken=xxx&expiresIn=900
 * 本页解析 hash → 保存令牌 → 拉取用户信息 → 进入首页
 */
const CallbackContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(140deg, #1b1f3b 0%, #2b2660 45%, #3d2f7d 75%, #241a4d 100%);
  color: #fff;
  flex-direction: column;
  gap: 16px;
`;

const Spinner = styled.div`
  width: 36px;
  height: 36px;
  border: 3px solid rgba(255, 255, 255, 0.25);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

const OAuthCallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const [message, setMessage] = useState('正在完成登录…');
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) {
      return;
    }
    handled.current = true;

    const parseHash = (): Record<string, string> => {
      const hash = window.location.hash.startsWith('#')
        ? window.location.hash.slice(1)
        : window.location.hash;
      const params: Record<string, string> = {};
      new URLSearchParams(hash).forEach((value, key) => {
        params[key] = value;
      });
      return params;
    };

    (async () => {
      const { accessToken, refreshToken } = parseHash();

      if (!accessToken) {
        Toast.error('登录失败：未获取到凭证');
        setTimeout(() => navigate('/login', { replace: true }), 600);
        return;
      }

      localStorage.setItem('token', accessToken);
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }

      setMessage('正在获取用户信息…');
      const result = await UserService.getCurrentUser();
      if (result.success && result.data) {
        const user = result.data;
        localStorage.setItem(
          'userInfo',
          JSON.stringify({
            id: user.id,
            username: user.username,
            email: user.email || '',
            role: user.role,
            avatar: user.avatar || '',
            status: user.status,
            createTime: user.createTime,
            updateTime: user.updateTime,
          })
        );
        localStorage.setItem('isLoggedIn', 'true');
        Toast.success('登录成功');
        navigate('/', { replace: true });
      } else {
        // 令牌无效：清理后回登录页
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        Toast.error(result.message || '登录失败');
        setTimeout(() => navigate('/login', { replace: true }), 600);
      }
    })();
  }, [navigate]);

  return (
    <CallbackContainer>
      <Spinner />
      <div>{message}</div>
    </CallbackContainer>
  );
};

export default OAuthCallbackPage;
