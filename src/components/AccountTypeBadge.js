/* ----------  AccountTypeBadge.jsx  ---------- */

import { Tag } from 'antd';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';

/* 1. Mapa tipo → estilo + texto */
const INFO = {
  admin   : { bg: '#00000080', label: 'Administrador' },
  free    : { bg: '#00000080', label: 'Gratuita' },
  premium : { bg: '#00000080', label: 'Premium' },
  gold    : { bg: '#00000080', label: 'Gold' },
};

/* 2. Tag con borde redondo y fondo custom */
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

  const info = INFO[type] ?? INFO.free;
  const { currentUser } = useAuth();

  return <Pill $bg={info.bg} style={{ margin: 0, padding: '7px 13px' }}>
        <img
            src={currentUser?.photoURL || DEFAULT_PROFILE_PICTURE_URL}
            alt="profile"
            width={30}
            height={30}
            style={{
            borderRadius: '50%',
            objectFit: 'cover',
            boxShadow: '0 0 6px rgba(0,0,0,0.1)',
            marginRight: 10
            }}
        />
        {info.label}
    </Pill>
}