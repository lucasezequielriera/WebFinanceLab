import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import "../index.css"
import "../styles/FinancialGoals.css";
import { Button, InputNumber, Form, notification, Spin, Tooltip, Select, Input, Space } from 'antd';
import { QuestionCircleTwoTone } from '@ant-design/icons';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

const { Option } = Select;

export default function FinancialGoals() {
    const { currentUser } = useAuth();
    const [limits, setLimits] = useState([{ amount: null, color: '#ff0000', label: 'Limit 1' }]);
    const [loading, setLoading] = useState(true);
    const [limitCount, setLimitCount] = useState(1);

    useEffect(() => {
        const fetchLimit = async () => {
            const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
            if (userDoc.exists()) {
                const data = userDoc.data();
                if (Array.isArray(data.expenseLimits)) {
                    setLimits(data.expenseLimits);
                    setLimitCount(data.expenseLimits.length);
                }
            }
            setLoading(false);
        };
        if (currentUser) fetchLimit();
    }, [currentUser]);

    const handleSave = async () => {
        setLoading(true);
        try {
            await updateDoc(doc(db, 'users', currentUser.uid), {
                expenseLimits: limits
            });
            notification.success({
                message: 'Limits Saved',
                description: 'Your expense limits have been saved successfully.',
            });
        } catch (error) {
            console.error(error);
            notification.error({ message: 'Error', description: 'Failed to save the limits.' });
        } finally {
            setLoading(false);
        }
    };

    const handleLimitChange = (index, field, value) => {
        const newLimits = [...limits];
        newLimits[index][field] = value;
        setLimits(newLimits);
    };

    const handleLimitCountChange = (value) => {
        setLimitCount(value);
        const newLimits = Array.from({ length: value }, (_, i) => limits[i] || { amount: null, color: '#ff0000', label: `Limit ${i + 1}` });
        setLimits(newLimits);
    };

    return (
        <Spin spinning={loading}>
            <div className="user-profile">
                <h2 className="title">Financial Goals</h2>
                <p style={{ marginBottom: 30, marginRight: 10 }}>You can check your financial goals here and configure everything.</p>
                <Form layout="vertical" onFinish={handleSave}>
                    <div style={{ display: 'flex', marginBottom: 0 }}>
                        <Form.Item label={
                                <span>
                                How many limits do you want to set?&nbsp;&nbsp;
                                <Tooltip title="You will see this on the Daily Expenses chart">
                                <QuestionCircleTwoTone />
                                </Tooltip>
                                </span>
                            }>
                            <Select value={limitCount} onChange={handleLimitCountChange} style={{ width: 100 }}>
                                {[1, 2, 3, 4, 5].map(num => <Option key={num} value={num}>{num}</Option>)}
                            </Select>
                            <Button type="primary" className="margin-left-small" htmlType="submit" loading={loading}>
                                Save
                            </Button>
                        </Form.Item>
                    </div>

                    {limits.map((limit, index) => (
                        <Space key={index} direction="vertical" className="labels" style={{ marginBottom: 20, marginRight: 10 }}>
                            <Form.Item label={`Limit ${index + 1} Label`}>
                                <Input
                                    value={limit.label}
                                    onChange={e => handleLimitChange(index, 'label', e.target.value)}
                                    style={{ width: '80%' }}
                                />
                                <Input
                                    type="color"
                                    value={limit.color}
                                    onChange={e => handleLimitChange(index, 'color', e.target.value)}
                                    style={{ width: '20%', verticalAlign: 'bottom' }}
                                />
                            </Form.Item>
                            <Form.Item label={`Limit ${index + 1} Amount`}>
                                <InputNumber
                                    value={limit.amount}
                                    onChange={value => handleLimitChange(index, 'amount', value)}
                                    min={0}
                                    prefix="$"
                                    style={{ width: '80%' }}
                                />
                            </Form.Item>
                        </Space>
                    ))}
                </Form>
            </div>
        </Spin>
    );
}