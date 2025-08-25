import React, { useState } from 'react';
import { Mail, Lock, User as UserIcon, ArrowLeft, GraduationCap } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

const SignupPage = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    studentId: '',
    year: '',
    department: '', // Add department to state
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { register, loading } = useAuthStore();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    const { fullName, email, studentId, year, department, password, confirmPassword } = formData;
    
    if (!fullName || !email || !studentId || !year || !department || !password || !confirmPassword) {
      setError('All fields are required');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    
    try {
      const userData = {
        fullName,
        email,
        password,
        studentId,
        year,
        department
      };
      
      await register(userData);
      setSuccess('Registration successful! Redirecting to login...');
      setError('');
      
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      let errorMessage = 'Registration failed. Please try again.';
      if (err.response?.data?.msg) {
        errorMessage = err.response.data.msg;
        if (errorMessage.includes('already exists with this email')) {
          errorMessage = 'This email is already registered. Please use a different email or try logging in.';
        } else if (errorMessage.includes('Student ID already registered')) {
          errorMessage = 'This Student ID is already registered. Please check your ID or contact an administrator.';
        }
      }
      setError(errorMessage);
      setSuccess('');
    }
  };
  
  return (
    <>
      {/* Logo and Title Block - This part is handled by AuthLayout now, but if specific titles are needed per page, they can be passed as props or managed here */}
      {/* Example: <h2 className="text-center text-2xl font-bold">Create Account</h2> */}
      
      <div className="mb-6">
        <Link 
          to="/login" 
          className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-500"
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Back to Login
        </Link>
      </div>
      
      {success && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 text-sm rounded-md" role="alert">
          {success}
        </div>
      )}
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 text-sm rounded-md" role="alert">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
            Full Name
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <UserIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            <input
              id="fullName"
              name="fullName"
              type="text"
              autoComplete="name"
              required
              value={formData.fullName}
              onChange={handleChange}
              className="appearance-none block w-full px-3 py-2 pl-10 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              placeholder="John Doe"
            />
          </div>
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email address
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="appearance-none block w-full px-3 py-2 pl-10 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              placeholder="you@example.com"
            />
          </div>
        </div>

        <div>
          <label htmlFor="studentId" className="block text-sm font-medium text-gray-700">
            Student ID
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-400 sm:text-sm">#</span>
            </div>
            <input
              id="studentId"
              name="studentId"
              type="text"
              required
              value={formData.studentId}
              onChange={handleChange}
              className="appearance-none block w-full px-3 py-2 pl-10 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              placeholder="CS12345"
            />
          </div>
          <p className="mt-2 text-xs text-gray-500">
            This will be your username for login.
          </p>
        </div>
        
        <div>
          <label htmlFor="year" className="block text-sm font-medium text-gray-700">
            Year of Study
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <GraduationCap className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            <select
              id="year"
              name="year"
              required
              value={formData.year}
              onChange={handleChange}
              className="appearance-none block w-full px-3 py-2 pl-10 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            >
              <option value="" disabled>Select your year</option>
              <option value="FE">First Year (FE)</option>
              <option value="SE">Second Year (SE)</option>
              <option value="TE">Third Year (TE)</option>
              <option value="BE">Final Year (BE)</option>
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="department" className="block text-sm font-medium text-gray-700">
            Department
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 h-5 w-5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="M12 11v0"></path></svg>
              </div>
            <select
              id="department"
              name="department"
              required
              value={formData.department}
              onChange={handleChange}
              className="appearance-none block w-full px-3 py-2 pl-10 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            >
              <option value="" disabled>Select your department</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Civil">Civil</option>
              <option value="Mechanical">Mechanical</option>
              <option value="Electronics (ENTC)">Electronics (ENTC)</option>
              <option value="AIML">AI/ML</option>
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="password"className="block text-sm font-medium text-gray-700">
            Password
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              value={formData.password}
              onChange={handleChange}
              className="appearance-none block w-full px-3 py-2 pl-10 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              placeholder="••••••••"
            />
          </div>
        </div>

        <div>
          <label htmlFor="confirmPassword"className="block text-sm font-medium text-gray-700">
            Confirm Password
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              value={formData.confirmPassword}
              onChange={handleChange}
              className="appearance-none block w-full px-3 py-2 pl-10 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              placeholder="••••••••"
            />
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </div>
      </form>

      {/* "Or" divider and "Sign in" link */}
      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">
              Or
            </span>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </>
  );
};

export default SignupPage;


