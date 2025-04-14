import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import "../index.css"
import "../styles/FinancialGoals.css";
import { Button, InputNumber, Form, notification, Spin, Tooltip, Select, Input, Space, Switch, Typography } from 'antd';
import { QuestionCircleTwoTone } from '@ant-design/icons';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import dayjs from 'dayjs';

const { Option } = Select;

export default function FinancialGoals() {
    const { currentUser } = useAuth();
    const [limits, setLimits] = useState([{ amount: null, color: '#ff0000', label: 'Limit 1' }]);
    const [loading, setLoading] = useState(true);
    const [limitCount, setLimitCount] = useState(1);
    const [manualMode, setManualMode] = useState(false);
    const [manualAmount, setManualAmount] = useState(0);
    const [calculatedDaily, setCalculatedDaily] = useState(null);
    const [userData, setUserData] = useState(null);
    const [autoCurrency, setAutoCurrency] = useState("USD"); // NUEVO

    const today = dayjs();
    const endOfMonth = dayjs().endOf('month');
    const daysRemaining = endOfMonth.diff(today, 'day') + 1; // ✅ incluye hoy

    const { Title, Text } = Typography;

    useEffect(() => {
        const fetchUserData = async () => {
            const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
            if (userDoc.exists()) {
                const data = userDoc.data();
                setUserData(data);
                if (Array.isArray(data.expenseLimits)) {
                    setLimits(data.expenseLimits);
                    setLimitCount(data.expenseLimits.length);
                }
            }
            setLoading(false);
        };
        if (currentUser) fetchUserData();
    }, [currentUser]);

    useEffect(() => {
        if (!userData) return;

        if (manualMode) {
            setCalculatedDaily(manualAmount && daysRemaining ? manualAmount / daysRemaining : null);
        } else if (userData?.jobs?.length > 0) {
            const totalIncome = userData.jobs.reduce((acc, job) => {
                const salary = parseFloat(job.salary || 0);
                const rate = job.currency === 'USD' ? 1100 : 1; // convertir a pesos si hace falta
                return acc + (salary * rate);
            }, 0);
            setCalculatedDaily(totalIncome / daysRemaining);
        }
    }, [manualMode, manualAmount, userData, daysRemaining]);

    useEffect(() => {
        if (manualMode) {
            setCalculatedDaily(manualAmount && daysRemaining ? manualAmount / daysRemaining : null);
        } else if (userData?.jobs?.length > 0) {
            const filteredJobs = userData.jobs.filter(job => job.currency === autoCurrency);
            const total = filteredJobs.reduce((acc, job) => acc + parseFloat(job.salary || 0), 0);
            setCalculatedDaily(total / daysRemaining);
        }
    }, [manualMode, manualAmount, userData, autoCurrency]);

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
                <hr/>
                <div style={{ marginTop: 30, marginBottom: 40 }}>
                    <Title level={4}>
                        Suggested Daily Expense Limit
                        <Switch
                            checkedChildren="Manual"
                            unCheckedChildren="Auto"
                            checked={manualMode}
                            onChange={(checked) => setManualMode(checked)}
                            style={{ marginLeft: 12, marginBottom: 0, verticalAlign: 'text-top' }}
                        /></Title>

                    {!manualMode && (
                        <Form.Item label="Currency to base your income on">
                            <Select
                                value={autoCurrency}
                                onChange={(val) => setAutoCurrency(val)}
                                style={{ width: 150 }}
                            >
                                <Option value="ARS">Pesos</Option>
                                <Option value="USD">Dollars</Option>
                            </Select>
                        </Form.Item>
                    )}

                    {manualMode && (
                        <Form.Item label="Available money for rest of month">
                            <InputNumber
                                min={0}
                                value={manualAmount}
                                onChange={setManualAmount}
                                prefix="$"
                                style={{ width: 200 }}
                            />
                        </Form.Item>
                    )}

                    <Text>
                        You can spend approximately <b>${calculatedDaily?.toFixed(2)}</b> per day
                        {manualMode ? ' for the rest of the month.' : ' this month.'} ({daysRemaining} days left)
                    </Text>
                </div>
                <hr/>
            </div>
        </Spin>
    );
}
