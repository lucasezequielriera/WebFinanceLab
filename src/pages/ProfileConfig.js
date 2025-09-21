import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { updateProfile, updatePassword, reauthenticateWithCredential,
    EmailAuthProvider } from "firebase/auth";
import { doc, getDoc, updateDoc, Timestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import { notification, Button, Input, Select, Modal, Form, Spin,
    message, Row, Col, Typography } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import countries from 'i18n-iso-countries';
import en from 'i18n-iso-countries/langs/en.json';
import es from 'i18n-iso-countries/langs/es.json';
import i18n from '../i18n';
// Components
import ImageCropper from '../components/ImageCropper';
// Styles
import "../index.css"
import "../styles/UserProfile.css";

const { Title } = Typography;

countries.registerLocale(en);
countries.registerLocale(es);

const DEFAULT_PROFILE_PICTURE_URL =
    "https://firebasestorage.googleapis.com/v0/b/finance-manager-d4589.appspot.com/o/profilePictures%2Fimage.png?alt=media&token=c7f97e78-1aa1-4b87-9c7a-a5ebe6087b3d";

const ProfileConfig = () => {
    const [initialUserData, setInitialUserData] = useState(null);
    const [isDirty, setIsDirty] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const [previewURL, setPreviewURL] = useState(DEFAULT_PROFILE_PICTURE_URL);
    const [imageLoading, setImageLoading] = useState(true);
    const [passwordModalVisible, setPasswordModalVisible] = useState(false);
    const [newPassword, setNewPassword] = useState("");
    const [updatingPassword, setUpdatingPassword] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [imageToCrop, setImageToCrop] = useState(null);
    const [croppedFile, setCroppedFile] = useState(null);
    const [cropModalVisible, setCropModalVisible] = useState(false);
    const [countryOptions, setCountryOptions] = useState([]);
    const [userData, setUserData] = useState({
        firstName: "",
        lastName: "",
        age: "",
        city: "",
        country: "",
        gender: "",
        phone: "",
        photoURL: DEFAULT_PROFILE_PICTURE_URL,
        language: ""
    });

    const { currentUser } = useAuth();
    const { t } = useTranslation();
    const navigate = useNavigate();

    const photoRef = useRef(null);

    useEffect(() => {
        let isMounted = true;
        const img = new Image();
        const locale = i18n.language.toLowerCase();
        const namesObj = countries.getNames(locale, { select: 'official' });
      
        const fetchUserData = async () => {
          if (currentUser) {
            const userDocRef = doc(db, "users", currentUser.uid);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists()) {
              const data = userDoc.data();
      
              if (!isMounted) return;
      
              setUserData(data);
              setInitialUserData(data);
              setPreviewURL(data.photoURL || DEFAULT_PROFILE_PICTURE_URL);
            }
          }
        };

        img.src = previewURL;
        img.onload = () => setImageLoading(false);

        const opts = Object.entries(namesObj)
        .map(([code, name]) => ({ value: name, label: name }))
        .sort((a, b) => a.label.localeCompare(b.label, locale));
      
        fetchUserData();
        setCountryOptions(opts);
      
        return () => {
          isMounted = false;
        };

    }, [currentUser, previewURL]);
      
    useEffect(() => setIsDirty(JSON.stringify(userData) !== JSON.stringify(initialUserData)), [userData, initialUserData]);
    
    useEffect(() => {
        if (userData && !imageLoading) {
            setTimeout(() => {
                setLoading(false);
            }, 500);
        }
    }, [userData, imageLoading, initialUserData]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setError("");
            setLoading(true);

            let photoURL = userData.photoURL || DEFAULT_PROFILE_PICTURE_URL;
            const phoneSafe = userData.phone ?? '';

                if (croppedFile) {
                    const photoStorageRef = ref(storage, `profilePictures/${currentUser.uid}`);

                    await uploadBytes(photoStorageRef, croppedFile);
                    photoURL = await getDownloadURL(photoStorageRef);
                }

            await updateProfile(currentUser, {
                displayName: `${userData.firstName} ${userData.lastName}`,
                photoURL: photoURL,
            });

            await updateDoc(doc(db, "users", currentUser.uid), {
                firstName: userData.firstName,
                lastName: userData.lastName,
                age: userData.age,
                city: userData.city,
                country: userData.country || "",
                gender: userData.gender,
                phone: phoneSafe,
                photoURL: photoURL,
                language: userData.language,
                lastActivity: Timestamp.now()
            });

            setInitialUserData({
                ...userData,
                photoURL: photoURL,
            });

            i18n.changeLanguage(userData.language);

            setLoading(false);
            openNotificationWithIcon('success', 'Profile Updated', 'Your profile has been successfully updated.');
        } catch (err) {
            console.error("Error updating profile:", err);
            setError("Failed to update profile");
            setLoading(false);
            openNotificationWithIcon('error', 'Update Failed', 'There was an error updating your profile. Please try again.');
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        setUserData((prevData) => ({
            ...prevData,
            [name]: value
        }));
    };
    
    const handleGenderChange = (value) => {
        setUserData(prevData => ({
            ...prevData,
            gender: value
        }));
    };     

    const handlePhotoChange = () => {
        const file = photoRef.current.files[0];

        if (file) {
          const reader = new FileReader();

          reader.onloadend = () => {
            setImageToCrop(reader.result);
            setCropModalVisible(true);
          };
          reader.readAsDataURL(file);
        }
    };

    const handleCropComplete = (croppedImageFile) => {
        const reader = new FileReader();

        reader.onloadend = () => {
            setPreviewURL(reader.result);
            setUserData(prev => ({ ...prev, photoURL: reader.result }));
            setCroppedFile(croppedImageFile);
            setCropModalVisible(false);
        };
        reader.readAsDataURL(croppedImageFile);
    };

    const openNotificationWithIcon = (type, message, description) => notification[type]({ message, description });

    const handlePasswordUpdate = async () => {
      if (!currentPassword || !newPassword || !confirmPassword) {
        message.error('Please fill all password fields');
        return;
      }
    
      if (newPassword !== confirmPassword) {
        message.error('New passwords do not match');
        return;
      }
    
      if (newPassword.length < 6) {
        message.error('Password must be at least 6 characters');
        return;
      }
    
      try {
        setUpdatingPassword(true);
    
        const credential = EmailAuthProvider.credential(
          currentUser.email,
          currentPassword
        );
    
        await reauthenticateWithCredential(currentUser, credential);
        await updatePassword(currentUser, newPassword);
    
        openNotificationWithIcon('success', 'Password Changed', 'Your password has been updated successfully.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setPasswordModalVisible(false);
      } catch (error) {
        console.error(error);
        message.error('The Password are wrong.');
      } finally {
        setUpdatingPassword(false);
      }
    };

    return (
        <div style={{ padding: '48px 60px', width: '100%', maxWidth: '1400px', margin: '0 auto' }}>
            <div style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <Title level={2} style={{ margin: 0, color: '#262626' }}>
                        Configuración de Perfil
                    </Title>
                </div>
                <Button 
                    icon={<ArrowLeftOutlined />} 
                    onClick={() => navigate('/configuration')}
                    type="text"
                >
                    Volver
                </Button>
            </div>

            <Spin spinning={loading}>
                {/* Profile Data */}
                <div className="user-profile">{error && <div>{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="display-flex center margin-bottom-medium margin-top-large">
                        <img
                        src={previewURL || DEFAULT_PROFILE_PICTURE_URL}
                        alt="Profile"
                        width="150"
                        height="150"
                        onClick={() => photoRef.current.click()}
                        style={{
                            cursor: "pointer",
                            borderRadius: '100%',
                            boxShadow: '0 0 14px 5px #0000004d',
                            objectFit: 'cover',
                            objectPosition: 'center'
                        }}
                        />
                        <input
                            type="file"
                            ref={photoRef}
                            accept="image/*"
                            onChange={handlePhotoChange}
                            style={{ display: "none" }}
                        />
                    </div>
                    <div className="display-flex center margin-bottom-large">
                    <Button
                        type="link"
                        onClick={() => setPasswordModalVisible(true)}
                        style={{ padding: 0, color: '#1890ff', fontWeight: 500 }}
                        >
                        {t('userProfile.profile.changePassword')}
                    </Button>
                    </div>
                    <div className="display-flex center">
                        <div className="display-flex w-200" style={{ flexFlow: "column" }}>
                            <Row gutter={16}>
                                <Col span={12}>
                                    <label className="label-small">{t('userProfile.profile.firstName')}</label>
                                    <Input type="text" className="margin-bottom-small"
                                        name="firstName"
                                        style={{ marginTop: 3}}
                                        value={userData.firstName}
                                        onChange={handleChange}
                                        placeholder="First Name"
                                        required
                                    />
                                </Col>
                                <Col span={12}>
                                    <label className="label-small">{t('userProfile.profile.lastName')}</label>
                                    <Input type="text" className="margin-bottom-small"
                                        name="lastName"
                                        style={{ marginTop: 3}}
                                        value={userData.lastName}
                                        onChange={handleChange}
                                        placeholder="Last Name"
                                        required
                                    />
                                </Col>
                            </Row>
                            <Row gutter={16}>
                                <Col span={12}>
                                    <label className="label-small">{t('userProfile.profile.age')}</label>
                                    <Input type="number" className="margin-bottom-small"
                                        name="age"
                                        style={{ marginTop: 3}}
                                        value={userData.age}
                                        onChange={handleChange}
                                        placeholder="Age"
                                    />
                                </Col>
                                <Col span={12}>
                                    <label className="label-small">{t('userProfile.profile.gender.label')}</label>
                                    <Select className="margin-bottom-small"
                                        placeholder="Select gender"
                                        style={{
                                            width: '100%',
                                            marginTop: 3
                                        }}
                                        value={userData.gender || undefined}
                                        onChange={handleGenderChange}
                                        options={[
                                            {
                                            value: 'male',
                                            label: t('userProfile.profile.gender.male'),
                                            },
                                            {
                                            value: 'female',
                                            label: t('userProfile.profile.gender.female'),
                                            },
                                            {
                                            value: 'other',
                                            label: t('userProfile.profile.gender.other'),
                                            }
                                        ]}
                                    />
                                </Col>
                            </Row>
                            <Row gutter={16}>
                                <Col span={12}>
                                    <label className="label-small">{t('userProfile.profile.city')}</label>
                                    <Input type="text" className="margin-bottom-small"
                                        name="city"
                                        style={{ marginTop: 3 }}
                                        value={userData.city}
                                        onChange={handleChange}
                                        placeholder="City"
                                    />
                                </Col>
                                <Col span={12}>
                                    <label className="label-small">{t('userProfile.profile.country')}</label>
                                    <Select
                                    showSearch
                                    placeholder="Select country"
                                    style={{ width: '100%', marginBottom: 8, marginTop: 3 }}
                                    optionFilterProp="label"
                                    value={userData.country}
                                    onChange={(val) => setUserData(prev => ({ ...prev, country: val }))}
                                    options={countryOptions}
                                    />
                                </Col>
                            </Row>
                            <Row gutter={16}>
                                <Col span={12}>
                                    <label className="label-small">{t('userProfile.profile.phone')}</label>
                                    <Input type="number"
                                        className="margin-bottom-small"
                                        style={{ marginTop: 3 }}
                                        name="phone"
                                        value={userData.phone}
                                        onChange={handleChange}
                                        placeholder="Phone"
                                    />
                                </Col>
                                <Col span={12}>
                                    <label className="label-small">{t('userProfile.profile.language.label')}</label>
                                    <Select
                                        style={{ width: '100%', marginTop: 3 }}
                                        value={userData.language}
                                        onChange={(value) => setUserData(prev => ({ ...prev, language: value }))}
                                        options={[
                                            { value: 'en', label: t('userProfile.profile.language.en') },
                                            { value: 'es', label: t('userProfile.profile.language.es') }
                                        ]}
                                    />
                                </Col>
                            </Row>
                        </div>
                    </div>
                    <div className="display-flex margin-top-large center">
                        <Button disabled={!isDirty} type="primary" htmlType="submit">{t('userProfile.profile.button')}</Button>
                    </div>
                </form>

                {/* Change password modal */}
                <Modal
                    title="Change Password"
                    open={passwordModalVisible}
                    onCancel={() => setPasswordModalVisible(false)}
                    footer={null}
                    >
                    <Form onFinish={handlePasswordUpdate}>
                        <Form.Item className="margin-bottom-small">
                            <Input.Password
                                placeholder="Current Password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                style={{ marginBottom: 10, marginTop: 15 }}
                            />
                        </Form.Item>

                        <Form.Item className="margin-bottom-small">
                            <Input.Password
                                placeholder="New Password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                style={{ marginBottom: 0 }}
                            />
                        </Form.Item>

                        <Form.Item>
                            <Input.Password
                                placeholder="Confirm New Password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                        </Form.Item>

                        <Form.Item>
                            <Button type="primary" htmlType="submit" loading={updatingPassword} block>
                                Change Password
                            </Button>
                        </Form.Item>
                    </Form>
                </Modal>
                
                {/* Select position in image component */}
                <ImageCropper
                image={imageToCrop}
                visible={cropModalVisible}
                onComplete={handleCropComplete}
                onCancel={() => setCropModalVisible(false)}
                />
                </div>

            </Spin>
        </div>
    );
}

export default ProfileConfig;
