import { useNavigate } from 'react-router-dom';
import React, { useState } from 'react';

import styled from 'styled-components';
import { Button, Form, Toast, Typography } from '@douyinfe/semi-ui';
import { IconLock, IconEyeClosed, IconEyeOpened } from '@douyinfe/semi-icons';

import { theme } from '../styles/theme';
import { UserService } from '../services';
import { Card } from '../components/common';

const { Title } = Typography;

const Container = styled.div`
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #e8efe9 0%, #dfe7e1 40%, #dbe6df 100%);
`;

const ChangeCard = styled(Card)`
  width: 100%;
  max-width: 420px;
  border-radius: ${theme.borderRadius['2xl']};
  box-shadow: ${theme.shadows.xl} !important;
  border: none !important;
  padding: ${theme.spacing.xl} !important;
`;

const StyledForm = styled(Form)`
  .semi-form-field {
    margin-bottom: 4px;
  }
  .semi-input-wrapper {
    background-color: #ffffff;
    border: 1px solid var(--semi-color-border);
    border-radius: 6px;
  }
  .semi-input-wrapper:focus-within {
    border-color: var(--semi-color-primary);
  }
`;

const SubmitButton = styled(Button)`
  width: 100%;
  height: 38px;
  border-radius: ${theme.borderRadius.base};
`;

export const ChangePasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
  const username = userInfo?.username || '';

  const onSubmit = async (values: Record<string, any>) => {
    try {
      if (!username) {
        Toast.error('当前未登录');
        return;
      }
      if (!values.oldPassword) {
        Toast.warning('请输入旧密码');
        return;
      }
      if (!values.newPassword) {
        Toast.warning('请输入新密码');
        return;
      }
      if (!values.confirmPassword) {
        Toast.warning('请再次输入新密码');
        return;
      }
      if (
        typeof values.newPassword !== 'string' ||
        values.newPassword.length < 6 ||
        values.newPassword.length > 20
      ) {
        Toast.error('新密码长度需为6-20位');
        return;
      }
      if (
        typeof values.confirmPassword !== 'string' ||
        values.confirmPassword.length < 6 ||
        values.confirmPassword.length > 20
      ) {
        Toast.error('确认密码长度需为6-20位');
        return;
      }
      if (values.newPassword !== values.confirmPassword) {
        Toast.warning('两次输入的新密码不一致');
        return;
      }
      setLoading(true);
      const resp = await UserService.updatePassword({
        username,
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
      });
      if (resp.code === '0000') {
        try {
          localStorage.removeItem('token');
          localStorage.removeItem('userInfo');
          localStorage.removeItem('isLoggedIn');
          localStorage.removeItem('chatHistory');
        } catch {}
        window.location.href = '/login';
        Toast.success('密码修改成功，请重新登录');
      } else {
        Toast.error(resp.msg || '密码修改失败');
      }
    } catch (e) {
      Toast.error('密码修改失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <ChangeCard>
        <Title heading={5} style={{ margin: 0 }}>
          修改密码
        </Title>
        <StyledForm onSubmit={onSubmit}>
          <Form.Input
            field="oldPassword"
            type={showOldPassword ? 'text' : 'password'}
            prefix={<IconLock />}
            label="原密码"
            placeholder="请输入旧密码"
            onPaste={() => {}}
            onCopy={() => {}}
            onCut={() => {}}
            suffix={
              <Button
                theme="borderless"
                icon={showOldPassword ? <IconEyeClosed /> : <IconEyeOpened />}
                onClick={() => {
                  const el = document.getElementById('oldPwd') as HTMLInputElement | null;
                  const start = el?.selectionStart ?? el?.value.length ?? 0;
                  const end = el?.selectionEnd ?? el?.value.length ?? 0;
                  setShowOldPassword(!showOldPassword);
                  setTimeout(() => {
                    const el2 = document.getElementById('oldPwd') as HTMLInputElement | null;
                    if (el2) {
                      el2.focus();
                      el2.setSelectionRange(start, end);
                    }
                  }, 0);
                }}
                style={{ padding: '4px' }}
              />
            }
            style={{ background: '#fff' }}
            id="oldPwd"
          />
          <Form.Input
            field="newPassword"
            type={showNewPassword ? 'text' : 'password'}
            prefix={<IconLock />}
            label="新密码"
            placeholder="请输入新密码（6-20个字符）"
            onPaste={() => {}}
            onCopy={() => {}}
            onCut={() => {}}
            suffix={
              <Button
                theme="borderless"
                icon={showNewPassword ? <IconEyeClosed /> : <IconEyeOpened />}
                onClick={() => {
                  const el = document.getElementById('newPwd') as HTMLInputElement | null;
                  const start = el?.selectionStart ?? el?.value.length ?? 0;
                  const end = el?.selectionEnd ?? el?.value.length ?? 0;
                  setShowNewPassword(!showNewPassword);
                  setTimeout(() => {
                    const el2 = document.getElementById('newPwd') as HTMLInputElement | null;
                    if (el2) {
                      el2.focus();
                      el2.setSelectionRange(start, end);
                    }
                  }, 0);
                }}
                style={{ padding: '4px' }}
              />
            }
            style={{ background: '#fff' }}
            id="newPwd"
          />
          <Form.Input
            field="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            prefix={<IconLock />}
            label="确认密码"
            placeholder="请再次输入新密码（6-20个字符）"
            onPaste={() => {}}
            onCopy={() => {}}
            onCut={() => {}}
            suffix={
              <Button
                theme="borderless"
                icon={showConfirmPassword ? <IconEyeClosed /> : <IconEyeOpened />}
                onClick={() => {
                  const el = document.getElementById('confirmPwd') as HTMLInputElement | null;
                  const start = el?.selectionStart ?? el?.value.length ?? 0;
                  const end = el?.selectionEnd ?? el?.value.length ?? 0;
                  setShowConfirmPassword(!showConfirmPassword);
                  setTimeout(() => {
                    const el2 = document.getElementById('confirmPwd') as HTMLInputElement | null;
                    if (el2) {
                      el2.focus();
                      el2.setSelectionRange(start, end);
                    }
                  }, 0);
                }}
                style={{ padding: '4px' }}
              />
            }
            style={{ background: '#fff' }}
            id="confirmPwd"
          />
          <SubmitButton type="primary" htmlType="submit" loading={loading}>
            确认修改
          </SubmitButton>
        </StyledForm>
        <Button theme="borderless" onClick={() => navigate(-1)} style={{ marginTop: 8 }}>
          返回
        </Button>
      </ChangeCard>
    </Container>
  );
};

export default ChangePasswordPage;
