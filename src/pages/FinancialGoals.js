import React, { useState, useEffect }                                       from "react";
import { useAuth }                                                          from "../contexts/AuthContext";
import { Button, InputNumber, Form, notification, Spin, Tooltip,
    Select, Input, Space, Switch, Typography, Empty }                       from 'antd';
import { QuestionCircleTwoTone }                                            from '@ant-design/icons';
import { collection, doc, getDocs, getDoc, setDoc }                         from 'firebase/firestore';
import { db }                                                               from '../firebase';
import dayjs                                                                from 'dayjs';
import isBetween                                                            from 'dayjs/plugin/isBetween';
import { useTranslation }                                                   from "react-i18next";
import useMonthlyMovements                                                  from '../hooks/useMonthlyMovements';
// Styles
import "../index.css"
import "../styles/FinancialGoals.css";

dayjs.extend(isBetween);

const FinancialGoals = () => {
    const [limits, setLimits]                   = useState([{ amount: null, color: '#ff0000', label: '' }]);
    const [loading, setLoading]                 = useState(true);
    const [limitCount, setLimitCount]           = useState(1);
    const [manualMode, setManualMode]           = useState(false);
    const [manualAmount, setManualAmount]       = useState(0);
    const [calculatedDaily, setCalculatedDaily] = useState(null);
    const [userData, setUserData]               = useState(null);
    const [autoCurrency, setAutoCurrency]       = useState("USD");
    const [exchangeRate, setExchangeRate]       = useState(1100);

    const { currentUser } = useAuth();
    const { t } = useTranslation();
    const { hasIncomes, hasExpenses } = useMonthlyMovements();
    
    const { Title, Text } = Typography;
    const { Option } = Select;

    const today = dayjs();
    const endOfMonth = dayjs().endOf('month');
    const daysRemaining = endOfMonth.diff(today, 'day') + 1;

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const [userDoc, expensesSnap, incomesSnap] = await Promise.all([
                    getDoc(doc(db, 'users', currentUser.uid)),
                    getDocs(collection(db, `users/${currentUser.uid}/expenses`)),
                    getDocs(collection(db, `users/${currentUser.uid}/incomes`))
                ]);

                    if (!userDoc.exists()) return;

                    const data = userDoc.data();

                    data.expenses = expensesSnap.docs.map(d => d.data());
                    data.incomes  = incomesSnap.docs.map(d => d.data());

                    setUserData(data);
        
                const monthKey = dayjs().format('YYYY-MM');
                const monthlyDocRef = doc(
                    db,
                    'users',
                    currentUser.uid,
                    'expenseLimitsByMonth',
                    monthKey
                );

                const monthlySnap = await getDoc(monthlyDocRef);
        
                if (monthlySnap.exists()) {
                    const { limits: monthlyLimits } = monthlySnap.data();

                    setLimits(monthlyLimits);
                    setLimitCount(monthlyLimits.length);
                } else if (Array.isArray(data.expenseLimits)) {
                    setLimits([{ amount: null, color: '#ff0000', label: 'Limit 1' }]);
                    setLimitCount(1);
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

    // Nueva función para traer el total de pagos fijos del mes actual
    async function fetchTotalFixedExpenses(autoCurrency, exchangeRate) {
        if (!currentUser) return 0;
        const monthKey = dayjs().format('YYYY-MM');
        const ref = doc(db, `users/${currentUser.uid}/monthlyPayments`, monthKey);
        const snap = await getDoc(ref);
        if (!snap.exists()) return 0;
        const payments = snap.data().payments || [];
        return payments.reduce((acc, p) => {
            const amount = autoCurrency === 'USD'
                ? (Number(p.amountUSD) || 0) + ((Number(p.amountARS) || 0) / exchangeRate)
                : (Number(p.amountARS) || 0) + ((Number(p.amountUSD) || 0) * exchangeRate);
            return acc + amount;
        }, 0);
    }

    useEffect(() => {
        if (!userData) return;

        const today         = dayjs();
        const startOfMonth  = today.startOf('month');
        const endOfMonth    = today.endOf('month');

        const filteredIncomes = userData.incomes?.filter(inc => {
            const date = dayjs(inc.timestamp?.toDate?.() || inc.timestamp);
            return date.isBetween(startOfMonth, endOfMonth, 'day', '[]');
        }) || [];

        const totalIncome = filteredIncomes.reduce((acc, inc) => {
            const amt = parseFloat(inc.amount || 0);

            return acc + (inc.currency === autoCurrency
              ? amt
              : (autoCurrency === "USD" ? amt / exchangeRate : amt * exchangeRate));
        }, 0);

        const totalExpenses = userData.expenses?.reduce((acc, expense) => {
            const date = dayjs(expense.timestamp?.toDate?.() || expense.timestamp);

            if (!date.isBetween(startOfMonth, endOfMonth, 'day', '[]')) return acc;

            const amount = parseFloat(expense.amount || 0);

            return acc + (expense.currency === autoCurrency
                ? amount
                : (autoCurrency === "USD" ? amount / exchangeRate : amount * exchangeRate));
        }, 0) || 0;

        // Nuevo: obtener totalFixedExpenses de monthlyPayments
        fetchTotalFixedExpenses(autoCurrency, exchangeRate).then(totalFixedExpenses => {
            const net = totalIncome - totalExpenses - totalFixedExpenses;
        if (manualMode) {
            setCalculatedDaily(manualAmount && daysRemaining ? manualAmount / daysRemaining : null);
        } else {
            setCalculatedDaily(net / daysRemaining);
            setManualAmount(Number(net.toFixed(2)));
        }
        });
    }, [manualMode, manualAmount, userData, autoCurrency, exchangeRate]);

    const handleSave = async () => {
        setLoading(true);

        try {
            const monthKey = dayjs().format('YYYY-MM');
            const monthlyDocRef = doc(
                db,
                'users',
                currentUser.uid,
                'expenseLimitsByMonth',
                monthKey
            );

            const existingDoc = await getDoc(monthlyDocRef);
            if (!existingDoc.exists()) {
                await setDoc(monthlyDocRef, { limits, createdAt: new Date().toISOString() }, { merge: true });
            } else {
            await setDoc(monthlyDocRef, { limits }, { merge: true });
            }

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

                {(hasIncomes && hasExpenses) ?
                <div className="financial-goals">

                    {/* Add Limits */}
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
                                <Select value={limitCount} onChange={handleLimitCountChange} style={{ width: 70 }} disabled>
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
                                        placeholder={t('userProfile.financialGoals.dailyLimitSelector.placeholder')}
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

                    {/* Suggested Limits */}
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
                </div> :

                // EMPTY DATA MESSAGE
                <div style={{ marginTop: 40 }}>
                    <Empty description={t("userProfile.financialGoals.withoutData")} />
                </div>}
                
            </Spin>
        </div>
    );
}

export default FinancialGoals;