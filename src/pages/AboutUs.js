import React                            from "react";
import { Spin, Button }                 from 'antd';
import { WhatsAppOutlined }             from '@ant-design/icons';
import { useTranslation }               from "react-i18next";
// Styles
import "../index.css"
import "../styles/UserProfile.css";

export default function UserProfile() {
    const { t } = useTranslation();

    const WhatsAppButton = () => {
        const whatsappURL = `https://wa.me/+34627043397?text=${t('userProfile.aboutUs.whatsappMessage')}`;
      
        return (
          <Button
            color="green" variant="solid"
            icon={<WhatsAppOutlined />}
            onClick={() => window.open(whatsappURL, '_blank')}
          >
            {t('userProfile.aboutUs.whatsappButton')}
          </Button>
        );
    };

    return (
        <div className="container-page">
            <Spin spinning={false}>
                <div className="user-profile">
                    <p style={{ whiteSpace: 'pre-line', marginTop: 10 }}>{t('userProfile.aboutUs.text')}</p>
                    <WhatsAppButton />
                </div>
            </Spin>
        </div>
    );
}
