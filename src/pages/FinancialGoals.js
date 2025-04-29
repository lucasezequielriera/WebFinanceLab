import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import "../index.css"
import "../styles/FinancialGoals.css";
import { Button, InputNumber, Form, notification, Spin, Tooltip, Select, Input, Space, Switch, Typography } from 'antd';
import { QuestionCircleTwoTone } from '@ant-design/icons';
import { collection, getDoc, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import { useTranslation } from "react-i18next";

dayjs.extend(isBetween);
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
    const [autoCurrency, setAutoCurrency] = useState("USD");
    const [exchangeRate, setExchangeRate] = useState(1100);

    const today = dayjs();
    const endOfMonth = dayjs().endOf('month');
    const daysRemaining = endOfMonth.diff(today, 'day') + 1;
    const { Title, Text } = Typography;

    const { t } = useTranslation();

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const [userDoc, expensesSnap, incomesSnap] = await Promise.all([
                    getDoc(doc(db, 'users', currentUser.uid)),
                    getDocs(collection(db, `users/${currentUser.uid}/expenses`)),
                    getDocs(collection(db, `users/${currentUser.uid}/incomes`))
                ]);

                if (userDoc.exists()) {
                    const data = userDoc.data();
                    data.expenses = expensesSnap.docs.map(doc => doc.data());
                    data.incomes  = incomesSnap.docs.map(d => d.data());

                    setUserData(data);
                    if (Array.isArray(data.expenseLimits)) {
                        setLimits(data.expenseLimits);
                        setLimitCount(data.expenseLimits.length);
                    }
                }
            } catch (e) {
                console.error("Error fetching data", e);
            } finally {
                setLoading(false);
            }
        };

        const fetchExchangeRate = async () => {
            try {
                const res = await fetch("https://dolarapi.com/v1/dolares/blue");
                const data = await res.json();
                if (data?.venta) setExchangeRate(data.venta);
            } catch (error) {
                console.warn("No se pudo obtener el valor del dólar blue, se usará 1100 por defecto.");
            }
        };

        if (currentUser) {
            fetchUserData();
            fetchExchangeRate();
        }
    }, [currentUser]);

    useEffect(() => {
        if (!userData) return;

        const totalIncome = userData.incomes?.reduce((acc, inc) => {
            const amt = parseFloat(inc.amount || 0);

            return acc + (inc.currency === autoCurrency
              ? amt
              : (autoCurrency === "USD" ? amt / exchangeRate : amt * exchangeRate));
        }, 0) || 0;          

        const startOfMonth = dayjs().startOf('month');
        const endOfMonth = dayjs().endOf('month');

        const totalExpenses = userData.expenses?.reduce((acc, expense) => {
            const date = dayjs(expense.timestamp?.toDate?.() || expense.timestamp);
            if (!date.isBetween(startOfMonth, endOfMonth, 'day', '[]')) return acc;

            const amount = parseFloat(expense.amount || 0);
            return acc + (expense.currency === autoCurrency
                ? amount
                : (autoCurrency === "USD" ? amount / exchangeRate : amount * exchangeRate));
        }, 0) || 0;

        const net = totalIncome - totalExpenses;

        if (manualMode) {
            setCalculatedDaily(manualAmount && daysRemaining ? manualAmount / daysRemaining : null);
        } else {
            setCalculatedDaily(net / daysRemaining);
            setManualAmount(Number(net.toFixed(2))); // Valor inicial cuando cambia a manual
        }
    }, [manualMode, manualAmount, userData, autoCurrency, exchangeRate]);

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
        <div className="container-page">
            <Spin spinning={loading}>
                <div className="user-profile">
                    <p style={{ marginBottom: 30, marginRight: 10, marginTop: 10 }}>{t('userProfile.financialGoals.subtitle')}</p>
                    <Form layout="vertical" onFinish={handleSave}>
                        <div style={{ display: 'flex', marginBottom: 0 }}>
                            <Form.Item label={
                                <span>
                                    {t('userProfile.financialGoals.dailyLimitSelector.title')}&nbsp;&nbsp;
                                    <Tooltip title={t('userProfile.financialGoals.dailyLimitSelector.tooltip')}>
                                        <QuestionCircleTwoTone />
                                    </Tooltip>
                                </span>
                            }>
                                <Select value={limitCount} onChange={handleLimitCountChange} style={{ width: 100 }} disabled>
                                    {[1, 2, 3, 4, 5].map(num => <Option key={num} value={num}>{num}</Option>)}
                                </Select>
                                <Button type="primary" className="margin-left-small" htmlType="submit" loading={loading}>
                                    {t('userProfile.financialGoals.dailyLimitSelector.button')}
                                </Button>
                            </Form.Item>
                        </div>

                        {limits.map((limit, index) => (
                            <Space key={index} direction="vertical" className="labels" style={{ marginBottom: 20, marginRight: 10 }}>
                                <Form.Item label={`${t('userProfile.financialGoals.dailyLimitSelector.labelInput')} ${index + 1}`}>
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
                                <Form.Item label={`${t('userProfile.financialGoals.dailyLimitSelector.amountInput')} ${index + 1}`}>
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

                    <hr />
                    <div style={{ marginTop: 30, marginBottom: 40 }}>
                        <Title level={4}>
                            {t('userProfile.financialGoals.suggestedLimit.title')}
                            <Switch
                                checkedChildren="Manual"
                                unCheckedChildren="Auto"
                                checked={manualMode}
                                onChange={(checked) => setManualMode(checked)}
                                style={{ marginLeft: 12, verticalAlign: 'text-top' }}
                            />
                        </Title>

                        {!manualMode && (
                            <Form.Item label={t('userProfile.financialGoals.suggestedLimit.inputText')}>
                                <Select
                                    value={autoCurrency}
                                    onChange={setAutoCurrency}
                                    style={{ width: 150 }}
                                >
                                    <Option value="ARS">ARS</Option>
                                    <Option value="USD">USD</Option>
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
                            {t('userProfile.financialGoals.suggestedLimit.suggestedResultText')} <b style={{ color: '#2cb212' }}>${calculatedDaily?.toFixed(2)}</b> ({daysRemaining} {t('userProfile.financialGoals.suggestedLimit.remainingDays')})*
                            {manualMode ?
                                <> <Tooltip title={t('userProfile.financialGoals.suggestedLimit.manualModeTooltip')}><QuestionCircleTwoTone /></Tooltip></>
                                :
                                <> <Tooltip title={t('userProfile.financialGoals.suggestedLimit.automaticModeTooltip')}><QuestionCircleTwoTone /></Tooltip></>
                            }
                        </Text>
                    </div>
                    <p style={{ fontSize: 12, color: '#363636' }}>{t('userProfile.financialGoals.suggestedLimit.helpText')}</p>
                    <hr />
                </div>
            </Spin>
        </div>
    );
}
