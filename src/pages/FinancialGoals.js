import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import "../index.css"
import "../styles/UserProfile.css";
import { Button, InputNumber, Form, notification, Spin } from 'antd';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function FinancialGoals() {
    const { currentUser } = useAuth();
    const [limit, setLimit] = useState(null);
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchLimit = async () => {
            const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
            if (userDoc.exists()) {
                const data = userDoc.data();
                setLimit(data.expenseLimit || null);
            }
            setLoading(false)
        };
        if (currentUser) fetchLimit();
    }, [currentUser]);

    const handleSave = async () => {
        setLoading(true);
        try {
            await updateDoc(doc(db, 'users', currentUser.uid), {
                expenseLimit: limit
            });
            notification.success({
                message: 'Limit Saved',
                description: 'Your expense limit has been saved successfully.',
            });
        } catch (error) {
            console.error(error);
            notification.error({ message: 'Error', description: 'Failed to save the limit.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Spin spinning={loading}>
            <div className="user-profile">
                <h2 className="title">Financial Goals</h2>
                <p>You can check your financial goals here:</p>
                <Form layout="vertical" onFinish={handleSave}>
                    <Form.Item label="Monthly Expense Limit">
                        <InputNumber
                            value={limit}
                            onChange={value => setLimit(value)}
                            min={0}
                            prefix="$"
                            style={{ width: '20%' }}
                        />
                    </Form.Item>
                    <Button type="primary" htmlType="submit" loading={loading}>
                        Save
                    </Button>
                </Form>
            </div>
        </Spin>
    );
}
