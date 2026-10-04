import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { LogIn, Mail, Lock, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { AUTH_SESSION_NOTICE_KEY, getFriendlyErrorMessage } from '../services/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const REMEMBERED_EMAIL_KEY = 'giftastic_remembered_email';

export default function Login() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const passwordRef = useRef(null);
  const [formData, setFormData] = useState({
    email: ''
  });
  const [rememberMe, setRememberMe] = useState(false);
  const [passwordPresent, setPasswordPresent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({});

  useEffect(() => {
    const rememberedEmail = localStorage.getItem(REMEMBERED_EMAIL_KEY) || '';
    if (rememberedEmail) {
      setFormData({ email: rememberedEmail });
      setRememberMe(true);
    }
    const sessionNotice = localStorage.getItem(AUTH_SESSION_NOTICE_KEY);
    if (sessionNotice) {
      setError(sessionNotice);
      toast.error(sessionNotice, { id: 'auth-session-notice' });
      localStorage.removeItem(AUTH_SESSION_NOTICE_KEY);
    }
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleBlur = (e) => {
    setTouched({ ...touched, [e.target.name]: true });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const password = passwordRef.current?.value || '';
      await login(formData.email, password, { remember: rememberMe });
      if (rememberMe) localStorage.setItem(REMEMBERED_EMAIL_KEY, formData.email.trim().toLowerCase());
      else localStorage.removeItem(REMEMBERED_EMAIL_KEY);
      toast.success('Welcome back!');
      navigate('/');
    } catch (err) {
      // Check if user is banned
      if (err.message?.includes('Account suspended') || err.message?.includes('banned')) {
        setError('Your account has been suspended. Please contact support.');
        toast.error('Account suspended');
        // Redirect to banned page after a short delay
        setTimeout(() => navigate('/banned'), 2000);
        return;
      }
      
      const msg = getFriendlyErrorMessage(err, 'Email or password is incorrect. Please try again.');
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <Navbar />
      
      <main className="flex-grow flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="text-center mb-10">
            <div className="bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <LogIn className="w-8 h-8 text-primary" />
            </div>
            <h2 className="font-display-xl text-headline-lg text-primary">
              Welcome Back
            </h2>
            <p className="mt-2 text-body-md text-on-surface-variant">
              Sign in to your Giftastic account
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-plum p-8 border border-outline-variant">
            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-error-container text-on-error-container px-4 py-3 rounded-lg text-sm flex items-center gap-2 animate-shake">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="email" className="block font-label-md text-on-surface-variant ml-1">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className={`w-5 h-5 ${touched.email && !formData.email ? 'text-error' : 'text-on-surface-variant'}`} />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full pl-11 pr-4 py-3 border rounded-xl outline-none transition-all focus:ring-2 ${
                      touched.email && !formData.email 
                        ? 'border-error focus:ring-error/20' 
                        : 'border-outline-variant focus:ring-primary focus:border-primary'
                    }`}
                    placeholder="you@example.com"
                  />
                </div>
                {touched.email && !formData.email && (
                  <p className="text-[10px] text-error font-bold ml-1 uppercase tracking-wider">Email is required</p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="block font-label-md text-on-surface-variant ml-1">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className={`w-5 h-5 ${touched.password && !passwordPresent ? 'text-error' : 'text-on-surface-variant'}`} />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    ref={passwordRef}
                    onChange={(event) => {
                      setPasswordPresent(Boolean(event.target.value));
                      setError('');
                    }}
                    onBlur={handleBlur}
                    className={`w-full pl-11 pr-4 py-3 border rounded-xl outline-none transition-all focus:ring-2 ${
                      touched.password && !passwordPresent
                        ? 'border-error focus:ring-error/20' 
                        : 'border-outline-variant focus:ring-primary focus:border-primary'
                    }`}
                    placeholder="Enter your password"
                  />
                </div>
                {touched.password && !passwordPresent && (
                  <p className="text-[10px] text-error font-bold ml-1 uppercase tracking-wider">Password is required</p>
                )}
              </div>

              <div className="flex items-center">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(event) => setRememberMe(event.target.checked)}
                    className="h-4 w-4 text-primary focus:ring-primary border-outline-variant rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-on-surface-variant">
                    Remember me
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-on-primary py-3 px-4 rounded-lg font-label-md hover:bg-primary-container active:scale-98 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-outline-variant"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-on-surface-variant">
                    Don't have an account?
                  </span>
                </div>
              </div>

              <div className="mt-6">
                <Link
                  to="/register"
                  className="w-full flex justify-center py-3 px-4 border border-primary text-primary rounded-lg font-label-md hover:bg-primary-container/10 transition-all"
                >
                  Create Account
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
