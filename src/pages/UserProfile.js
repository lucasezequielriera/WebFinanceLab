import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { updateProfile } from "firebase/auth";
import { db, storage } from "../firebase"; // Importa db y storage
import { doc, getDoc, updateDoc } from "firebase/firestore"; // Importa Firestore
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"; // Importa Storage
import { useNavigate } from "react-router-dom";
import { PlusOutlined } from '@ant-design/icons';
import { notification, Button, Input, Select, Table, Modal, Form, Spin } from 'antd';
import "../index.css"
import "../styles/UserProfile.css"; // Importa el archivo CSS

const { Option } = Select;

const DEFAULT_PROFILE_PICTURE_URL =
    "https://firebasestorage.googleapis.com/v0/b/finance-manager-d4589.appspot.com/o/profilePictures%2Fimage.png?alt=media&token=c7f97e78-1aa1-4b87-9c7a-a5ebe6087b3d";

export default function UserProfile() {
    const { currentUser } = useAuth();
    const [userData, setUserData] = useState({
        firstName: "",
        lastName: "",
        age: "",
        city: "",
        gender: "", // Inicializar como cadena vacía
        phone: "",
        photoURL: "",
        jobs: [],
    });
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [newJobData, setNewJobData] = useState({ title: '', salary: '', type: 'employed' });
    const [editJobIndex, setEditJobIndex] = useState(null); // Índice del trabajo en edición
    const [editJobData, setEditJobData] = useState({ title: '', salary: '', type: 'employed' }); // Datos del trabajo en edición
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true); // Estado de carga
    const [previewURL, setPreviewURL] = useState(DEFAULT_PROFILE_PICTURE_URL); // Imagen preestablecida
    const [imageLoading, setImageLoading] = useState(true); // Estado de carga de la imagen
    const navigate = useNavigate();
    const photoRef = useRef(null);

    useEffect(() => {
        async function fetchUserData() {
            if (currentUser) {
                const userDocRef = doc(db, "users", currentUser.uid);
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists()) {
                    const data = userDoc.data();
                    setUserData(data);
                    setPreviewURL(data.photoURL || DEFAULT_PROFILE_PICTURE_URL); // Establece la URL de la imagen
                }
                setLoading(false); // Terminar la carga después de obtener los datos
            }
        }
        fetchUserData();
    }, [currentUser]);

    useEffect(() => {
        // Manejar la carga de la imagen
        const img = new Image();
        img.src = previewURL;
        img.onload = () => setImageLoading(false); // Termina la carga cuando la imagen se ha cargado
    }, [previewURL]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!userData.gender) {
            setError('Gender is required');
            return;
        }

        try {
            setError("");
            setLoading(true);
            let photoURL = userData.photoURL;
            if (photoRef.current && photoRef.current.files[0]) {
                const photoFile = photoRef.current.files[0];
                const photoStorageRef = ref(
                    storage,
                    `profilePictures/${currentUser.uid}`
                );
                await uploadBytes(photoStorageRef, photoFile);
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
                phone: userData.phone,
                photoURL: photoURL,
                jobs: userData.jobs,
            });
            setLoading(false);
            navigate("/dashboard");
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
        setUserData((prevData) => ({ ...prevData, [name]: value }));
    };

    const handleGenderChange = (value) => {
        setUserData(prevData => ({ ...prevData, gender: value }));
    };

    const showModal = () => {
        setIsModalVisible(true);
      };
      
      const handleOk = () => {
        const updatedJobs = [...userData.jobs, newJobData];
        setUserData(prevData => ({ ...prevData, jobs: updatedJobs }));
        setIsModalVisible(false);
        setNewJobData({ title: '', salary: '', type: 'employed' });
      };
      
      const handleCancel = () => {
        setIsModalVisible(false);
        setNewJobData({ title: '', salary: '', type: 'employed' });
      };
      
      const handleNewJobChange = (e) => {
        const { name, value } = e.target;
        setNewJobData(prevJob => ({ ...prevJob, [name]: value }));
      };
      
      const handleNewJobTypeChange = (value) => {
        setNewJobData(prevJob => ({ ...prevJob, type: value }));
      };

    const handleEditJob = (index) => {
        setEditJobData(userData.jobs[index]); // Inicializa editJobData con los datos del trabajo seleccionado
        setEditJobIndex(index);
    };

    const handleDeleteJob = (index) => {
        const updatedJobs = userData.jobs.filter((_, i) => i !== index);
        setUserData(prevData => ({ ...prevData, jobs: updatedJobs }));
    };

    const handleEditJobChange = (e) => {
        const { name, value } = e.target;
        setEditJobData(prevJob => ({ ...prevJob, [name]: value }));
    };
    
    const handleConfirmEditJob = () => {
        const updatedJobs = userData.jobs.map((job, index) =>
          index === editJobIndex ? editJobData : job
        );
        setUserData(prevData => ({ ...prevData, jobs: updatedJobs }));
        setEditJobIndex(null);
    };

    const handlePhotoChange = () => {
        const file = photoRef.current.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewURL(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const openNotificationWithIcon = (type, message, description) => {
        notification[type]({
          message: message,
          description: description,
        });
    };

    const columns = [
        {
            title: 'Job Title',
            dataIndex: 'title',
            key: 'title',
            render: (text, record, index) => (
            editJobIndex === index ? 
                <Input name="title" value={editJobData.title} onChange={handleEditJobChange} /> :
                text
            ),
        },
        {
            title: 'Salary',
            dataIndex: 'salary',
            key: 'salary',
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
            render: (text, record, index) => (
                editJobIndex === index ? 
                <Select name="type" value={editJobData.type} onChange={(value) => setEditJobData(prevData => ({ ...prevData, type: value }))}>
                    <Option value="employed">Employed</Option>
                    <Option value="self-employed">Self-Employed</Option>
                </Select> :
                text
            ),
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record, index) => (
                editJobIndex === index ? 
                <Button type="link" onClick={handleConfirmEditJob} style={{ backgroundColor: 'green', color: 'white'}}>Confirm Changes</Button> :
                <>
                    <Button type="link" onClick={() => handleEditJob(index)}>Edit</Button>
                    <Button type="primary" onClick={() => handleDeleteJob(index)} danger ghost>Delete</Button>
                </>
            ),
        },
    ];

    if (loading || imageLoading) {
        return <Spin tip="Loading..." size="large" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div style={{ height: '100vh' }} />
    </Spin>
    }

    return (
        <div className="user-profile">
            <h2 className="title">User Profile</h2>
            {error && <div>{error}</div>}
            <form onSubmit={handleSubmit}>
                <div className="display-flex center margin-bottom-large margin-top-large">
                    <img
                        src={previewURL || "https://via.placeholder.com/150"} // Imagen preestablecida
                        alt="Profile"
                        width="150"
                        height="150"
                        onClick={() => photoRef.current.click()} // Hacer clic para cambiar la imagen
                        style={{ cursor: "pointer" }}
                    />
                    <input
                        type="file"
                        ref={photoRef}
                        accept="image/*"
                        onChange={handlePhotoChange}
                        style={{ display: "none" }} // Ocultar el input de archivo
                    />
                </div>
                <div className="display-flex center">
                    <div className="display-flex w-200" style={{ flexFlow: "column" }}>
                        <label className="label-small">First Name</label>
                        <Input type="text" className="margin-bottom-small"
                            name="firstName"
                            value={userData.firstName}
                            onChange={handleChange}
                            placeholder="First Name"
                            required
                        />
                        <label className="label-small">Last Name</label>
                        <Input type="text" className="margin-bottom-small"
                            name="lastName"
                            value={userData.lastName}
                            onChange={handleChange}
                            placeholder="Last Name"
                            required
                        />
                        <label className="label-small">Age</label>
                        <Input type="number" className="margin-bottom-small"
                            name="age"
                            value={userData.age}
                            onChange={handleChange}
                            placeholder="Age"
                        />
                        <label className="label-small">City</label>
                        <Input type="text" className="margin-bottom-small"
                            name="city"
                            value={userData.city}
                            onChange={handleChange}
                            placeholder="City"
                        />
                        <label className="label-small">Gender</label>
                        <Select className="margin-bottom-small"
                            defaultValue="Select gender"
                            style={{
                                width: '100%',
                            }}
                            value={userData.gender}
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
                        <label className="label-small">Phone</label>
                        <Input type="number"
                            name="phone"
                            value={userData.phone}
                            onChange={handleChange}
                            placeholder="Phone"
                        />
                    </div>
                </div>
                <div className="display-flex center margin-top-large margin-bottom-small" style={{ alignItems: 'baseline' }}>
                <h3 className="margin-right-small">Current Incomes</h3>
                <Button type="primary" size="small" shape="circle" icon={<PlusOutlined />} onClick={showModal} />
                </div>
                <div className="display-flex center">
                <Table className="margin-bottom-large" pagination={false} style={{width: 900 }} columns={columns} dataSource={userData.jobs} rowKey={(record) => record.title} />
                <Modal title="Add New Job" visible={isModalVisible} onOk={handleOk} onCancel={handleCancel}>
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
                    </Form>
                </Modal>
                </div>
                <div className="display-flex center">
                    <Button disabled={loading} type="primary" htmlType="submit">Save changes</Button>
                </div>
            </form>
        </div>
    );
}
