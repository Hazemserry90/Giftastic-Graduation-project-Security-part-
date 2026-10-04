import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { UserPlus, Mail, Lock, User, ShieldCheck, AlertCircle, CheckCircle2, Circle } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { getPasswordRequirements, validateEmail, validatePassword } from '../utils/registrationValidation';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function Register() {
  const navigate = useNavigate();
  const register = useAuthStore((state) => state.register);
  const passwordRef = useRef(null);
  const confirmPasswordRef = useRef(null);
  const [formData, setFormData] = useState({
    name: '',
    email: ''
  });
  const [passwordState, setPasswordState] = useState({
    hasPassword: false,
    error: validatePassword(''),
    requirements: getPasswordRequirements(''),
    hasConfirmPassword: false,
    passwordsMatch: true,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({});
  const emailError = validateEmail(formData.email);
  const isFormValid = Boolean(formData.name.trim())
    && !emailError
    && passwordState.hasPassword
    && !passwordState.error
    && passwordState.hasConfirmPassword
    && passwordState.passwordsMatch;

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const readPasswordState = () => {
    const password = passwordRef.current?.value || '';
    const confirmPassword = confirmPasswordRef.current?.value || '';
    return {
      hasPassword: Boolean(password),
      error: validatePassword(password),
      requirements: getPasswordRequirements(password),
      hasConfirmPassword: Boolean(confirmPassword),
      passwordsMatch: !confirmPassword || password === confirmPassword,
    };
  };

  const updatePasswordState = () => {
    const nextPasswordState = readPasswordState();
    setPasswordState(nextPasswordState);
    setError('');
    return nextPasswordState;
  };

  const handleBlur = (e) => {
    setTouched({ ...touched, [e.target.name]: true });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setTouched({ name: true, email: true, password: true, confirmPassword: true });
    const nextPasswordState = updatePasswordState();
    const nextFormValid = Boolean(formData.name.trim())
      && !emailError
      && nextPasswordState.hasPassword
      && !nextPasswordState.error
      && nextPasswordState.hasConfirmPassword
      && nextPasswordState.passwordsMatch;

    if (!nextFormValid) {
      const msg = emailError || nextPasswordState.error || (!nextPasswordState.passwordsMatch ? 'Passwords do not match' : 'Complete all required fields');
      setError(msg);
      toast.error(msg);
      return;
    }

    setLoading(true);

    try {
      await register({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: passwordRef.current?.value || '',
      });
      toast.success('Account created successfully!');
      navigate('/');
    } catch (err) {
      const response = err.response?.data;
      const msg = response?.message || response?.error || response?.email || response?.password || 'Registration failed';
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
              <UserPlus className="w-8 h-8 text-primary" />
            </div>
            <h2 className="font-display-xl text-headline-lg text-primary">
              Create Your Account
            </h2>
            <p className="mt-2 text-body-md text-on-surface-variant">
              Join Giftastic and start your gifting journey
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
                <label htmlFor="name" className="block font-label-md text-on-surface-variant ml-1">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className={`w-5 h-5 ${touched.name && !formData.name ? 'text-error' : 'text-on-surface-variant'}`} />
                  </div>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full pl-11 pr-4 py-3 border rounded-xl outline-none transition-all focus:ring-2 ${
                      touched.name && !formData.name 
                        ? 'border-error focus:ring-error/20' 
                        : 'border-outline-variant focus:ring-primary focus:border-primary'
                    }`}
                    placeholder="Your Name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="block font-label-md text-on-surface-variant ml-1">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className={`w-5 h-5 ${touched.email && emailError ? 'text-error' : 'text-on-surface-variant'}`} />
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
                    aria-invalid={touched.email && Boolean(emailError)}
                    aria-describedby="email-help"
                    className={`w-full pl-11 pr-4 py-3 border rounded-xl outline-none transition-all focus:ring-2 ${
                      touched.email && emailError
                        ? 'border-error focus:ring-error/20' 
                        : 'border-outline-variant focus:ring-primary focus:border-primary'
                    }`}
                    placeholder="you@example.com"
                  />
                </div>
                <p id="email-help" className={`text-xs ml-1 ${touched.email && emailError ? 'text-error' : 'text-on-surface-variant'}`}>
                  {touched.email && emailError ? emailError : 'Supported providers: Gmail, Outlook, Hotmail, Live, iCloud, and Yahoo.'}
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="block font-label-md text-on-surface-variant ml-1">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className={`w-5 h-5 ${touched.password && passwordState.error ? 'text-error' : 'text-on-surface-variant'}`} />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    ref={passwordRef}
                    onChange={updatePasswordState}
                    onBlur={handleBlur}
                    aria-invalid={touched.password && Boolean(passwordState.error)}
                    aria-describedby="password-requirements"
                    className={`w-full pl-11 pr-4 py-3 border rounded-xl outline-none transition-all focus:ring-2 ${
                      touched.password && passwordState.error
                        ? 'border-error focus:ring-error/20' 
                        : 'border-outline-variant focus:ring-primary focus:border-primary'
                    }`}
                    placeholder="Create a strong password"
                  />
                </div>
                <ul id="password-requirements" className="grid grid-cols-1 sm:grid-cols-2 gap-1 pt-1 ml-1" aria-label="Password requirements">
                  {passwordState.requirements.map(({ label, met }) => (
                    <li key={label} className={`flex items-center gap-1.5 text-xs ${met ? 'text-primary' : 'text-on-surface-variant'}`}>
                      {met ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}
                      {label}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="block font-label-md text-on-surface-variant ml-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <ShieldCheck className={`w-5 h-5 ${touched.confirmPassword && !passwordState.passwordsMatch ? 'text-error' : 'text-on-surface-variant'}`} />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    ref={confirmPasswordRef}
                    onChange={updatePasswordState}
                    onBlur={handleBlur}
                    className={`w-full pl-11 pr-4 py-3 border rounded-xl outline-none transition-all focus:ring-2 ${
                      touched.confirmPassword && !passwordState.passwordsMatch
                        ? 'border-error focus:ring-error/20' 
                        : 'border-outline-variant focus:ring-primary focus:border-primary'
                    }`}
                    placeholder="Re-enter your password"
                  />
                </div>
                {touched.confirmPassword && !passwordState.passwordsMatch && (
                  <p className="text-[10px] text-error font-bold ml-1 uppercase tracking-wider">Passwords do not match</p>
                )}
              </div>

              <div className="flex items-center group cursor-pointer">
                <input
                  id="terms"
                  name="terms"
                  type="checkbox"
                  required
                  className="h-4 w-4 text-primary focus:ring-primary border-outline-variant rounded transition-all cursor-pointer"
                />
                <label htmlFor="terms" className="ml-2 block text-sm text-on-surface-variant cursor-pointer group-hover:text-on-surface transition-colors">
                  I agree to the{' '}
                  <a href="#" className="text-primary hover:underline font-medium">
                    Terms and Conditions
                  </a>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading || !isFormValid}
                className="w-full bg-primary text-on-primary py-4 rounded-xl font-label-md hover:bg-primary-container active:scale-[0.98] transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>

            <div className="mt-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-outline-variant"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-4 bg-white text-on-surface-variant font-medium">
                    Already have an account?
                  </span>
                </div>
              </div>

              <div className="mt-8">
                <Link
                  to="/login"
                  className="w-full flex justify-center py-3.5 px-4 border border-outline-variant text-primary rounded-xl font-label-md hover:bg-surface-container transition-all"
                >
                  Sign In
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
