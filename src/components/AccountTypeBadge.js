import React, { useMemo, useState } from 'react';
import { Tag, Dropdown, Menu } from 'antd';
import { DownOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';      // <-- importa esto
import useIsMobile from '../hooks/useIsMobile';

const Pill = styled(Tag)`
  background: ${({ $bg }) => $bg};
  border: none;
  color: #fff;
  font-weight: 600;
  padding: 4px 18px;
  border-radius: 999px;
`;

const DEFAULT_PROFILE_PICTURE_URL =
  "https://firebasestorage.googleapis.com/v0/b/finance-manager-d4589.appspot.com/o/profilePictures%2Fimage.png?alt=media&token=c7f97e78-1aa1-4b87-9c7a-a5ebe6087b3d";

export default function AccountTypeBadge({ type = 'free' }) {
  const { currentUser, logout } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();                    // <-- usa el hook
  const isMobile = useIsMobile();

  const [menuOpen, setMenuOpen] = useState(false);

  const types = useMemo(() => ({
    admin:   { bg: '#00000080', label: t("userProfile.typeOfAccount.admin") },
    free:    { bg: '#00000080', label: t("userProfile.typeOfAccount.freeAccount") },
    premium: { bg: '#00000080', label: t("userProfile.typeOfAccount.premiumAccount") },
    gold:    { bg: '#00000080', label: t("userProfile.typeOfAccount.goldAccount") },
  }), [t]);

  const info = types[type] || types.free;

  const menu = (
    <Menu
      onClick={({ key }) => {
        if (key === 'logout') {
          logout();
        } else {
          navigate(key);
        }
        setMenuOpen(false);
      }}
    >
      <Menu.Item key="/dashboard">Dashboard</Menu.Item>
      <Menu.Item key="/expenses">Expenses</Menu.Item>
      <Menu.Item key="/financial-goals">Financial Goals</Menu.Item>
      <Menu.Item key="/profile">Profile</Menu.Item>
      <Menu.Divider />
      <Menu.Item key="logout">Logout</Menu.Item>
    </Menu>
  );

  // si es mobile, renderiza el dropdown; si no, solo la pill
  if (!isMobile) {
    return (
      <Pill $bg={info.bg} style={{ margin: 0, padding: '7px 13px' }}>
        <img
          src={currentUser?.photoURL || DEFAULT_PROFILE_PICTURE_URL}
          alt="profile"
          width={30}
          height={30}
          style={{
            borderRadius: '50%',
            objectFit: 'cover',
            boxShadow: '0 0 6px rgba(0,0,0,0.1)',
            marginRight: 8
          }}
        />
        {info.label}
      </Pill>
    );
  }

  return (
    <Dropdown
      overlay={menu}
      trigger={['click']}
      placement="bottomRight"
      open={menuOpen}                              // <-- visible → open
      onOpenChange={setMenuOpen}                   // <-- visible change handler
    >
      <Pill $bg={info.bg} style={{ margin: 0, padding: '7px 13px' }}>
        <img
          src={currentUser?.photoURL || DEFAULT_PROFILE_PICTURE_URL}
          alt="profile"
          width={30}
          height={30}
          style={{
            borderRadius: '50%',
            objectFit: 'cover',
            boxShadow: '0 0 6px rgba(0,0,0,0.1)',
            marginRight: 8
          }}
        />
        {info.label}
        <DownOutlined
          style={{
            marginLeft: 5,
            verticalAlign: 'text-bottom',
            transition: 'transform 0.2s',
            transform: menuOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      </Pill>
    </Dropdown>
  );
}