import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/router';
import SilhouetteImage from '../../public/images/silhouette.png'; // Adjust the path as necessary

// ✅ Mock API function for login
const mockLoginAPI = (email: string, password: string): Promise<{ success: boolean; token: string }> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // Mock logic: only allow this user/password
      if (email === 'demo@sap.com' && password === 'password123') {
        resolve({ success: true, token: 'mock-token-123' });
      } else {
        reject(new Error('Invalid credentials'));
      }
    }, 1000); // simulate network delay
  });
};

const LoginPage: React.FC = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await mockLoginAPI(email, password);
      console.log('Login success:', response);
      // Optionally: store token, etc.
      router.push('/dashboard');
    } catch (error) {
      setError('Invalid email or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page-standalone-root">
      <div className="login-page-container">
        <div className="login-page-chat-demo-panel">
          <div className="login-page-chat-content">
            <div className="login-page-message login-page-user-input">
              <p>Hi, How can I help you ?</p>
            </div>
            <div className="login-page-message login-page-user-question">
              <p>Any random question according</p>
            </div>
            <div className="login-page-message login-page-ai-response">
              <p>An insightful insight that insights the insight, form the given insight of the data.</p>
            </div>
          </div>
          <div className="login-page-silhouette-container">
            <Image 
              src={SilhouetteImage} 
              alt="AI Assistant Silhouette" 
              className="login-page-silhouette-image"
              priority
            />
          </div>
        </div>

        <div className="login-page-form-panel">
          <div className="login-page-form-container">
            <h1 className="login-page-title">Log In</h1>
            <p className="login-page-description">
              A future-driven workspace that simplifies workflows, accelerates insights, 
              and empowers smarter decisions
            </p>
            
            {error && <div className="login-page-error-message" role="alert">{error}</div>}
            
            <form onSubmit={handleSubmit} autoComplete="off">
              <div className="login-page-form-group">
                <label htmlFor="email" className="login-page-label">Email</label>
                <input
                  type="email"
                  id="email"
                  className="login-page-input"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="username"
                />
              </div>

              <div className="login-page-form-group">
                <label htmlFor="password" className="login-page-label">Password</label>
                <div className="login-page-password-container">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    className="login-page-input"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                  <button 
                    type="button" 
                    className="login-page-toggle-password"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button 
                type="submit" 
                className="login-page-submit-button" 
                disabled={isLoading}
              >
                {isLoading ? 'Logging in...' : 'Login'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;