import { useNavigate } from 'react-router-dom';
import React, { useEffect, useState, useRef } from 'react';

import styled from 'styled-components';
import {
  Button,
  Form,
  Toast,
  Typography,
  Select,
  Avatar,
  TextArea,
  Input,
  Radio,
} from '@douyinfe/semi-ui';
import { IconUpload, IconUser, IconMail, IconPhone } from '@douyinfe/semi-icons';

import { theme } from '../styles/theme';
import { UserService, UserInfoResponseDTO, UserInfoRequestDTO } from '../services/user-service';
import { Card } from '../components/common';

const { Title } = Typography;

const Container = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #e8efe9 0%, #dfe7e1 40%, #dbe6df 100%);
`;

const InfoCard = styled(Card)`
  width: 100%;
  max-width: 720px;
  border-radius: ${theme.borderRadius['2xl']};
  box-shadow: ${theme.shadows.xl} !important;
  border: none !important;
  padding: ${theme.spacing.xl} !important;
`;

const Row = styled.div`
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  grid-template-areas: 'left right';
  gap: ${theme.spacing.lg};
  align-items: start;
  margin-top: ${theme.spacing.base};
  @media (max-width: ${theme.breakpoints.md}) {
    grid-template-columns: 1fr;
    grid-template-areas:
      'right'
      'left';
  }
`;

const LeftCol = styled.div`
  grid-area: left;
`;
const RightCol = styled.div`
  grid-area: right;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${theme.spacing.base};
`;

const StyledForm = styled(Form)`
  .semi-form-field {
    margin-bottom: 8px;
  }
  .semi-input-wrapper {
    background-color: #ffffff !important;
    border: 1px solid var(--semi-color-border) !important;
    border-radius: 6px !important;
  }
  .semi-input-wrapper:focus-within {
    border-color: var(--semi-color-primary) !important;
  }
  .white-select,
  .white-select .semi-select-selection,
  .white-select .semi-select-selection__rendered,
  .white-select .semi-select-selection__icon {
    background-color: #ffffff !important;
  }
  .white-select .semi-select-selection {
    border: 1px solid var(--semi-color-border) !important;
    border-radius: 6px !important;
  }
  .white-select.semi-select-focus .semi-select-selection {
    border-color: var(--semi-color-primary) !important;
  }
  .semi-input-textarea,
  textarea.semi-input-textarea {
    background-color: #ffffff !important;
    border: 1px solid var(--semi-color-border) !important;
    border-radius: 6px !important;
    resize: vertical !important;
  }
  .semi-input-textarea:focus-within,
  textarea.semi-input-textarea:focus {
    border-color: var(--semi-color-primary) !important;
  }
`;

const ActionsRow = styled.div`
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: ${theme.spacing.base};
  margin-top: ${theme.spacing.base};
`;

const UploadTip = styled.div`
  font-size: ${theme.typography.fontSize.sm};
  color: ${theme.colors.text.tertiary};
`;

const AvatarPreview = styled(Avatar)`
  width: 120px !important;
  height: 120px !important;
  border-radius: 50% !important;
  box-shadow: ${theme.shadows.lg};
` as any;

const HiddenFileInput = styled.input`
  display: none;
`;

const UserInfoPage: React.FC = () => {
  const DEFAULT_AVATAR =
    'https://wanyj-lxzs.oss-cn-beijing.aliyuncs.com/e9ce9097-bd0c-4ee1-bf90-bcf394cc0e8b.jpg';
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formApi, setFormApi] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saveCooldown, setSaveCooldown] = useState(false);
  const [uploadCooldown, setUploadCooldown] = useState(false);
  const [saveRemaining, setSaveRemaining] = useState(0);
  const [uploadRemaining, setUploadRemaining] = useState(0);
  const saveTimerRef = useRef<any>(null);
  const uploadTimerRef = useRef<any>(null);

  const localUser = JSON.parse(localStorage.getItem('userInfo') || '{}');
  const userId = localUser?.id || localUser?.userId;

  const [userData, setUserData] = useState<UserInfoResponseDTO | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);

  const fetchUser = async () => {
    if (!userId) {
      Toast.error('未获取到用户ID');
      return;
    }
    setLoading(true);
    try {
      const resp = await UserService.getUserInfo(userId);
      if (resp.code === '0000') {
        const data = resp.data || {};
        const avatar = data.avatar || DEFAULT_AVATAR;
        setUserData({ ...data, avatar });
        setAvatarUrl(avatar);
        formApi?.setValues({
          id: data.id,
          userId: data.userId,
          nickname: data.nickname,
          sex: data.sex,
          phone: data.phone,
          email: data.email,
          language: data.language,
          bio: data.bio,
        });
      } else {
        Toast.error(resp.msg || '获取用户信息失败');
      }
    } catch (e) {
      Toast.error('获取用户信息失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, [userId, formApi]);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      Toast.error('头像大小不能超过5MB');
      return;
    }
    setUploading(true);
    try {
      const resp = await UserService.uploadAvatar(file);
      if (resp.code === '0000' && resp.data) {
        const url = resp.data;
        setAvatarUrl(url);
        setUserData((prev) => ({ ...(prev || {}), avatar: url }));
        Toast.success('头像上传成功');
        if (uploadTimerRef.current) {
          clearInterval(uploadTimerRef.current);
          uploadTimerRef.current = null;
        }
        setUploadCooldown(true);
        setUploadRemaining(15);
        uploadTimerRef.current = setInterval(() => {
          setUploadRemaining((prev) => {
            if (prev <= 1) {
              clearInterval(uploadTimerRef.current);
              uploadTimerRef.current = null;
              setUploadCooldown(false);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        Toast.error(resp.msg || '头像上传失败');
      }
    } catch (e) {
      Toast.error('头像上传失败');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (values: Record<string, any>) => {
    try {
      if (!userId) {
        Toast.error('未获取到用户ID');
        return;
      }
      const payload: UserInfoRequestDTO = {
        id: values.id,
        userId: values.userId || userId,
        nickname: values.nickname,
        sex: Number(values.sex),
        phone: values.phone,
        email: values.email,
        avatar: avatarUrl || DEFAULT_AVATAR,
        language: Number(values.language),
        bio: values.bio,
      };
      setLoading(true);
      const resp = await UserService.updateUserInfo(payload);
      if (resp.code === '0000') {
        Toast.success('用户信息已更新');
        // 更新本地缓存的昵称与头像
        try {
          const local = JSON.parse(localStorage.getItem('userInfo') || '{}');
          local.nickname = payload.nickname;
          local.avatar = payload.avatar || DEFAULT_AVATAR;
          localStorage.setItem('userInfo', JSON.stringify(local));
        } catch {}
        if (saveTimerRef.current) {
          clearInterval(saveTimerRef.current);
          saveTimerRef.current = null;
        }
        setSaveCooldown(true);
        setSaveRemaining(15);
        saveTimerRef.current = setInterval(() => {
          setSaveRemaining((prev) => {
            if (prev <= 1) {
              clearInterval(saveTimerRef.current);
              saveTimerRef.current = null;
              setSaveCooldown(false);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        Toast.error(resp.msg || '更新失败');
      }
    } catch (e) {
      Toast.error('更新失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <InfoCard>
        <Title heading={5} style={{ margin: 0 }}>
          个人中心
        </Title>
        <Row>
          <LeftCol>
            <StyledForm getFormApi={setFormApi} onSubmit={handleSubmit}>
              <Form.Input
                field="nickname"
                label="昵称"
                prefix={<IconUser />}
                placeholder="请输入昵称"
              />
              <Form.RadioGroup field="sex" label="性别">
                <Radio value={0}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ color: '#1890ff', fontSize: 15 }}>♂</span>男
                  </span>
                </Radio>
                <Radio value={1}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ color: '#ff4d8f', fontSize: 15 }}>♀</span>女
                  </span>
                </Radio>
              </Form.RadioGroup>
              <Form.Input
                field="phone"
                label="电话"
                prefix={<IconPhone />}
                placeholder="请输入电话"
                rules={[
                  {
                    validator: (
                      _rule: any,
                      value: any,
                      callback: (error?: string | void) => void
                    ) => {
                      const v = (value || '').trim();
                      if (!v) {
                        callback();
                        return true;
                      }
                      if (/^1[3-9]\d{9}$/.test(v)) {
                        callback();
                        return true;
                      }
                      callback('手机号格式不正确');
                      return false;
                    },
                  },
                ]}
              />
              <Form.Input
                field="email"
                label="邮箱"
                prefix={<IconMail />}
                placeholder="请输入邮箱"
                rules={[
                  {
                    validator: (
                      _rule: any,
                      value: any,
                      callback: (error?: string | void) => void
                    ) => {
                      const v = (value || '').trim();
                      if (!v) {
                        callback();
                        return true;
                      }
                      if (/^[^\s@]+@[^\s@]+\.com$/i.test(v)) {
                        callback();
                        return true;
                      }
                      callback('邮箱格式错误');
                      return false;
                    },
                  },
                ]}
              />
              <Form.RadioGroup field="language" label="偏好语言">
                <Radio value={0}>中文</Radio>
                <Radio value={1}>英文</Radio>
              </Form.RadioGroup>
              <Form.TextArea field="bio" label="个人简介" placeholder="一句话介绍自己" rows={4} />
            </StyledForm>
          </LeftCol>
          <RightCol>
            <AvatarPreview src={(avatarUrl as any) || DEFAULT_AVATAR} alt="avatar" />
            <HiddenFileInput
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
            />
            <Button
              icon={<IconUpload />}
              onClick={handleUploadClick}
              loading={uploading || uploadCooldown}
              disabled={uploadCooldown}
            >
              上传头像{uploadCooldown ? `(${uploadRemaining}s)` : ''}
            </Button>
            <UploadTip>支持 jpg/png/webp，大小≤5MB</UploadTip>
          </RightCol>
        </Row>
        <ActionsRow>
          <Button theme="borderless" onClick={() => navigate(-1)} style={{ justifySelf: 'start' }}>
            返回
          </Button>
          <Button
            type="primary"
            loading={loading || saveCooldown}
            disabled={saveCooldown}
            onClick={() => formApi?.submitForm?.()}
            style={{ justifySelf: 'center' }}
          >
            保存信息{saveCooldown ? `(${saveRemaining}s)` : ''}
          </Button>
          <span style={{ justifySelf: 'end' }} />
        </ActionsRow>
      </InfoCard>
    </Container>
  );
};

export default UserInfoPage;
