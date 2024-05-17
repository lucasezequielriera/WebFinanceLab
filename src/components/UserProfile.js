import React, { useRef, useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { updateProfile } from "firebase/auth";
import { db } from '../firebase'; // Importa db
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore"; // Importa Firestore
import { useNavigate } from 'react-router-dom';

export default function UserProfile() {
  const { currentUser } = useAuth();
  const firstNameRef = useRef();
  const lastNameRef = useRef();
  const ageRef = useRef();
  const cityRef = useRef();
  const genderRef = useRef();
  const [jobs, setJobs] = useState([]);
  const [newJob, setNewJob] = useState({ title: '', salary: '', type: 'legal' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchUserData() {
      if (currentUser) {
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const data = userDoc.data();
          firstNameRef.current.value = data.firstName || '';
          lastNameRef.current.value = data.lastName || '';
          ageRef.current.value = data.age || '';
          cityRef.current.value = data.city || '';
          genderRef.current.value = data.gender || 'male';
          setJobs(data.jobs || []);
        } else {
          await setDoc(userDocRef, {
            firstName: '',
            lastName: '',
            age: '',
            city: '',
            gender: '',
            jobs: []
          });
        }
      }
    }
    fetchUserData();
  }, [currentUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setError('');
      setLoading(true);
      await updateProfile(currentUser, {
        displayName: `${firstNameRef.current.value} ${lastNameRef.current.value}`
      });
      await updateDoc(doc(db, "users", currentUser.uid), {
        firstName: firstNameRef.current.value,
        lastName: lastNameRef.current.value,
        age: ageRef.current.value,
        city: cityRef.current.value,
        gender: genderRef.current.value,
        jobs: jobs
      });
      navigate('/dashboard');
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile');
    }

    setLoading(false);
  };

  const handleAddJob = () => {
    setJobs([...jobs, newJob]);
    setNewJob({ title: '', salary: '', type: 'legal' });
  };

  const handleJobChange = (e) => {
    const { name, value } = e.target;
    setNewJob(prevJob => ({ ...prevJob, [name]: value }));
  };

  return (
    <div>
      <h2>User Profile</h2>
      {error && <div>{error}</div>}
      <form onSubmit={handleSubmit}>
        <label>First Name</label>
        <input type="text" ref={firstNameRef} required />
        <label>Last Name</label>
        <input type="text" ref={lastNameRef} required />
        <label>Age</label>
        <input type="number" ref={ageRef} required />
        <label>City</label>
        <input type="text" ref={cityRef} required />
        <label>Gender</label>
        <select ref={genderRef} required>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>
        <h3>Jobs</h3>
        {jobs.map((job, index) => (
          <div key={index}>
            <p>{job.title} - {job.salary} - {job.type}</p>
          </div>
        ))}
        <div>
          <input type="text" name="title" placeholder="Job Title" value={newJob.title} onChange={handleJobChange} />
          <input type="number" name="salary" placeholder="Salary" value={newJob.salary} onChange={handleJobChange} />
          <select name="type" value={newJob.type} onChange={handleJobChange}>
            <option value="legal">Legal</option>
            <option value="illegal">Illegal</option>
          </select>
          <button type="button" onClick={handleAddJob}>Add Job</button>
        </div>
        <button disabled={loading} type="submit">Update Profile</button>
      </form>
    </div>
  );
}