import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { updateProfile, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { db, storage } from "../firebase"; // Importa db y storage
import { doc, getDoc, updateDoc } from "firebase/firestore"; // Importa Firestore
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"; // Importa Storage
// import { useNavigate } from "react-router-dom";
import { PlusOutlined } from '@ant-design/icons';
import { notification, Button, Input, Select, Table, Modal, Form, Spin, message, Row, Col } from 'antd';
import ImageCropper from '../components/ImageCropper';
import i18n from '../i18n'; // o './i18n' según la ruta correcta a tu archivo i18n.js
import { useTranslation } from "react-i18next";
import "../index.css"
import "../styles/UserProfile.css"; // Importa el archivo CSS

const { Option } = Select;

const DEFAULT_PROFILE_PICTURE_URL =
    "https://firebasestorage.googleapis.com/v0/b/finance-manager-d4589.appspot.com/o/profilePictures%2Fimage.png?alt=media&token=c7f97e78-1aa1-4b87-9c7a-a5ebe6087b3d";

export default function UserProfile() {
    const { currentUser } = useAuth();
    const [initialUserData, setInitialUserData] = useState(null);
    const [userData, setUserData] = useState({
        firstName: "",
        lastName: "",
        age: "",
        city: "",
        gender: "", // Inicializar como cadena vacía
        phone: "",
        photoURL: DEFAULT_PROFILE_PICTURE_URL,
        jobs: [],
        displayBalance: "", // valor por defecto
        language: ""
    });
    const [isDirty, setIsDirty] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [newJobData, setNewJobData] = useState({ title: '', salary: '', type: 'employed', currency: 'ARS' });
    const [editJobIndex, setEditJobIndex] = useState(null); // Índice del trabajo en edición
    const [editJobData, setEditJobData] = useState({ title: '', salary: '', type: 'employed', currency: 'ARS' }); // Datos del trabajo en edición
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true); // Estado de carga
    const [previewURL, setPreviewURL] = useState(DEFAULT_PROFILE_PICTURE_URL); // Imagen preestablecida
    const [imageLoading, setImageLoading] = useState(true); // Estado de carga de la imagen
    // const navigate = useNavigate();
    const photoRef = useRef(null);
    const [passwordModalVisible, setPasswordModalVisible] = useState(false);
    const [newPassword, setNewPassword] = useState("");
    const [updatingPassword, setUpdatingPassword] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [imageToCrop, setImageToCrop] = useState(null);
    const [croppedFile, setCroppedFile] = useState(null);
    const [cropModalVisible, setCropModalVisible] = useState(false);

    const { t } = useTranslation();

    useEffect(() => {
        let isMounted = true;
      
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
      
        fetchUserData();
      
        return () => {
          isMounted = false;
        };
    }, [currentUser]);
      
    // Este para el estado de isDirty
    useEffect(() => {
        setIsDirty(JSON.stringify(userData) !== JSON.stringify(initialUserData));
    }, [userData, initialUserData]);
    
    // Este se mantiene aparte porque depende de la carga de imagen, no del usuario
    useEffect(() => {
        const img = new Image();
        img.src = previewURL;
        img.onload = () => setImageLoading(false); // Termina la carga de la imagen
    }, [previewURL]);
    
    // ✅ Y en un lugar donde tengas ambos loading controlados:
    useEffect(() => {
        if (userData && !imageLoading) {
            setTimeout(() => {
                setLoading(false); // solo desactiva cuando ambos están listos
              }, 500);
        }
    }, [userData, imageLoading, initialUserData]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setError("");
            setLoading(true);
            console.log(userData)
            let photoURL = userData.photoURL || DEFAULT_PROFILE_PICTURE_URL;
            const phoneSafe = userData.phone ?? '';   // '' o cualquier valor string

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
                gender: userData.gender,
                phone: phoneSafe,
                photoURL: photoURL,
                jobs: userData.jobs,
                language: userData.language
            });
            setInitialUserData({
                ...userData,
                photoURL: photoURL,
            });        
            await updateDoc(doc(db, "users", currentUser.uid), {
                ...userData,
                displayBalance: userData.displayBalance,
              });

            i18n.changeLanguage(userData.language);

            setLoading(false);
            // navigate("/dashboard");
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

    const showModal = () => {
        setIsModalVisible(true);
    };
    
    const handleOk = async () => {
        const updatedJobs = [...userData.jobs, newJobData];
        setUserData(prevData => ({ ...prevData, jobs: updatedJobs }));
        try {
            await updateDoc(doc(db, "users", currentUser.uid), {
                jobs: updatedJobs,
            });
            setIsModalVisible(false);
            setNewJobData({ title: '', salary: '', type: 'employed', currency: 'ARS' });
            openNotificationWithIcon('success', 'Job Added', 'The job has been added successfully.');
        } catch (err) {
            console.error("Error updating jobs:", err);
            setError("Failed to add job");
            openNotificationWithIcon('error', 'Add Failed', 'There was an error adding the job. Please try again.');
        }
    };
    
    const handleCancel = () => {
        setIsModalVisible(false);
        setNewJobData({ title: '', salary: '', type: 'employed', currency: 'ARS' });
    };
    
    const handleNewJobChange = (e) => {
        const { name, value } = e.target;
        setNewJobData(prevJob => ({ ...prevJob, [name]: value }));
    };
    
    const handleNewJobTypeChange = (value) => {
        setNewJobData(prevJob => ({ ...prevJob, type: value }));
    };

    const handleNewJobCurrencyChange = (value) => {
        setNewJobData(prevJob => ({ ...prevJob, currency: value }));
    };

    const handleEditJob = (index) => {
        setEditJobData(userData.jobs[index]); // Inicializa editJobData con los datos del trabajo seleccionado
        setEditJobIndex(index);
    };

    const handleDeleteJob = async (index) => {
        const updatedJobs = userData.jobs.filter((_, i) => i !== index);
        setUserData(prevData => ({ ...prevData, jobs: updatedJobs }));
        try {
            await updateDoc(doc(db, "users", currentUser.uid), {
                jobs: updatedJobs,
            });
            openNotificationWithIcon('success', 'Job Deleted', 'The job has been deleted successfully.');
        } catch (err) {
            console.error("Error deleting job:", err);
            setError("Failed to delete job");
            openNotificationWithIcon('error', 'Delete Failed', 'There was an error deleting the job. Please try again.');
        }
    };

    const handleEditJobChange = (e) => {
        const { name, value } = e.target;
        setEditJobData(prevJob => ({ ...prevJob, [name]: value }));
    };

    const handleEditJobCurrencyChange = (value) => {
        setEditJobData(prevJob => ({ ...prevJob, currency: value }));
    };
    
    const handleConfirmEditJob = async () => {
        const updatedJobs = userData.jobs.map((job, index) =>
            index === editJobIndex ? editJobData : job
        );
        setUserData(prevData => ({ ...prevData, jobs: updatedJobs }));
        try {
            await updateDoc(doc(db, "users", currentUser.uid), {
                jobs: updatedJobs,
            });
            setEditJobIndex(null);
            openNotificationWithIcon('success', 'Job Updated', 'The job has been updated successfully.');
        } catch (err) {
            console.error("Error updating jobs:", err);
            setError("Failed to update job");
            openNotificationWithIcon('error', 'Update Failed', 'There was an error updating the job. Please try again.');
        }
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

    // nueva función para manejar imagen recortada
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

    const openNotificationWithIcon = (type, message, description) => {
        notification[type]({
          message,
          description,
        });
    };

    const columns = [
        {
            title: 'Job Title',
            dataIndex: 'title',
            key: 'title',
            width: '20%',
            ellipsis: true, // Truncate text in mobile view
            render: (text, record, index) => (
                editJobIndex === index ? 
                <Input name="title" value={editJobData.title} onChange={handleEditJobChange} /> :
                text
            ),
        },
        {
            title: 'Currency',
            dataIndex: 'currency',
            key: 'currency',
            width: '20%',
            render: (text, record, index) => (
                editJobIndex === index ? 
                <Select value={editJobData.currency} onChange={handleEditJobCurrencyChange} style={{ minWidth: 50 }}>
                    <Option value="ARS">ARS</Option>
                    <Option value="USD">USD</Option>
                </Select> :
                text
            ),
        },
        {
            title: 'Salary',
            dataIndex: 'salary',
            key: 'salary',
            width: '20%',
            render: (text, record, index) => (
                editJobIndex === index ? 
                <Input name="salary" value={editJobData.salary} onChange={handleEditJobChange} /> :
                text
            ),
        },
        {
            title: 'Contract Type',
            dataIndex: 'type',
            key: 'type',
            width: '20%',
            render: (text, record, index) => (
                editJobIndex === index ? 
                <Select name="type" value={editJobData.type} onChange={(value) => setEditJobData(prevData => ({ ...prevData, type: value }))}>
                    <Option value="employed">Employed</Option>
                    <Option value="self-employed">Self-Employed</Option>
                </Select> :
                text
            ),
            responsive: ['md'], // Hide column in extra-small view
        },
        {
            title: 'Actions',
            key: 'actions',
            width: '20%',
            render: (_, record, index) => (
                editJobIndex === index ? 
                <div style={{ textAlign: 'center' }}><Button type="link" onClick={handleConfirmEditJob} style={{ color: 'green', border: '1px solid green' }}>Confirm</Button></div> :
                    <div style={{ textAlign: 'center' }}>
                        <Button type="link" onClick={() => handleEditJob(index)}>Edit</Button>
                        <Button type="primary" onClick={() => handleDeleteJob(index)} danger ghost>Delete</Button>
                    </div>
            ),
            responsive: ['md'], // Hide column in extra-small view
        },
    ];

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
        <Spin spinning={loading}>
            <div className="user-profile">
                <h2 className="title">{t('userProfile.profile.title')}</h2>
                {error && <div>{error}</div>}
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
                            style={{ display: "none" }} // Ocultar el input de archivo
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
                            <label className="label-small">{t('userProfile.profile.firstName')}</label>
                            <Input type="text" className="margin-bottom-small"
                                name="firstName"
                                value={userData.firstName}
                                onChange={handleChange}
                                placeholder="First Name"
                                required
                            />
                            <label className="label-small">{t('userProfile.profile.lastName')}</label>
                            <Input type="text" className="margin-bottom-small"
                                name="lastName"
                                value={userData.lastName}
                                onChange={handleChange}
                                placeholder="Last Name"
                                required
                            />
                            <label className="label-small">{t('userProfile.profile.age')}</label>
                            <Input type="number" className="margin-bottom-small"
                                name="age"
                                value={userData.age}
                                onChange={handleChange}
                                placeholder="Age"
                            />
                            <label className="label-small">{t('userProfile.profile.city')}</label>
                            <Input type="text" className="margin-bottom-small"
                                name="city"
                                value={userData.city}
                                onChange={handleChange}
                                placeholder="City"
                            />
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
                                    <label className="label-small">{t('userProfile.profile.gender')}</label>
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
                                            label: 'Male',
                                            },
                                            {
                                            value: 'female',
                                            label: 'Female',
                                            },
                                            {
                                            value: 'other',
                                            label: 'Other',
                                            }
                                        ]}
                                    />
                                </Col>
                            </Row>
                            <Row gutter={16}>
                                <Col span={12}>
                                    <label className="label-small">{t('userProfile.profile.balanceDisplay')}</label>
                                    <Select
                                        style={{ width: '100%', marginTop: 3 }}
                                        value={userData.displayBalance}
                                        onChange={(value) => setUserData(prev => ({ ...prev, displayBalance: value }))}
                                        options={[
                                            { value: 'ARS', label: 'ARS' },
                                            { value: 'USD', label: 'USD' },
                                            { value: 'Both', label: 'Both' },
                                        ]}
                                    />
                                </Col>
                                <Col span={12}>
                                    <label className="label-small">{t('userProfile.profile.language')}</label>
                                    <Select
                                        style={{ width: '100%', marginTop: 3 }}
                                        value={userData.language}
                                        onChange={(value) => setUserData(prev => ({ ...prev, language: value }))}
                                        options={[
                                            { value: 'en', label: 'English' },
                                            { value: 'es', label: 'Spanish' }
                                        ]}
                                    />
                                </Col>
                            </Row>
                        </div>
                    </div>
                    <div className="display-flex margin-top-large center">
                        <Button disabled={!isDirty} type="primary" htmlType="submit">{t('userProfile.profile.button')}</Button>
                    </div>
                    <hr style={{ marginTop: 30, borderColor: '#fafafa8c' }}/>
                    <div className="display-flex center margin-top-large margin-bottom-large" style={{ alignItems: 'center' }}>
                        <h1 className="margin-right-medium" style={{ fontWeight: 200, margin: 0, marginRight: 10 }}>{t('userProfile.profile.currentIncomes')}</h1>
                        <Button type="primary" size="medium" shape="circle" icon={<PlusOutlined />} onClick={showModal} />
                    </div>
                    <div className="display-flex center">
                        <Table className="margin-bottom-large" pagination={false} style={{width: 1200 }} columns={columns} dataSource={userData.jobs} rowKey={(record) => record.title} />
                        <Modal title="Add New Job" open={isModalVisible} onOk={handleOk} onCancel={handleCancel}>
                            <Form layout="vertical">
                                <Form.Item label="Title">
                                    <Input name="title" value={newJobData.title} onChange={handleNewJobChange} />
                                </Form.Item>
                                <Form.Item label="Salary">
                                    <Input name="salary" type="number" value={newJobData.salary} onChange={handleNewJobChange} />
                                </Form.Item>
                                <Form.Item label="Type">
                                    <Select value={newJobData.type} onChange={handleNewJobTypeChange}>
                                    <Option value="employed">Employed</Option>
                                    <Option value="self-employed">Self-Employed</Option>
                                    </Select>
                                </Form.Item>
                                <Form.Item label="Currency">
                                    <Select value={newJobData.currency} onChange={handleNewJobCurrencyChange}>
                                        <Option value="ARS">ARS</Option>
                                        <Option value="USD">USD</Option>
                                    </Select>
                                </Form.Item>
                            </Form>
                        </Modal>
                    </div>
                </form>
                <Modal
                    title="Change Password"
                    open={passwordModalVisible}
                    onCancel={() => setPasswordModalVisible(false)}
                    footer={null} // ✅ sacamos el botón OK del modal, lo ponemos en el form
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
                <ImageCropper
                image={imageToCrop}
                visible={cropModalVisible}
                onComplete={handleCropComplete}
                onCancel={() => setCropModalVisible(false)}
                />
            </div>
        </Spin>
    );
}
