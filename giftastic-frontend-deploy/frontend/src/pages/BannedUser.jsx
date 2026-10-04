import { useAuthStore } from '../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { clearStoredToken } from '../services/authStorage';
import { buildUserAccess, getReadableUserField, USER_CONTEXT } from '../ui/entities/user';

export default function BannedUser() {
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const viewer = useAuthStore((state) => state.viewer);
  const access = buildUserAccess({ user, viewer, context: USER_CONTEXT.SELF });
  const email = getReadableUserField(user, 'email', access.fields.email).value;
  const supportEmail = 'support@giftastic.com';
  const supportHref = 'mailto:support@giftastic.com?subject=Account%20Ban%20Appeal';
  const [supportOpen, setSupportOpen] = useState(false);
  const [copyMessage, setCopyMessage] = useState('');

  // Clear token to prevent API calls but keep user info to show email
  useEffect(() => {
    clearStoredToken();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const openSupport = () => {
    setCopyMessage('');
    setSupportOpen(true);
  };

  const copySupportEmail = async () => {
    let copied = false;
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard API unavailable');
      await navigator.clipboard.writeText(supportEmail);
      copied = true;
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = supportEmail;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        copied = document.execCommand('copy');
      } catch {
        copied = false;
      } finally {
        document.body.removeChild(textarea);
      }
    }

    setCopyMessage(copied
      ? 'Support email copied to clipboard.'
      : 'Copy failed. The email is shown above so you can copy it manually.');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-red-500 to-orange-500 p-8 text-center">
          <span className="material-symbols-outlined text-white" style={{ fontSize: 80 }}>
            block
          </span>
          <h1 className="text-3xl font-bold text-white mt-4">Account Suspended</h1>
        </div>
        
        <div className="p-8 space-y-6">
          <div className="text-center">
            <p className="text-lg text-gray-700 mb-4">
              Your account has been suspended and you no longer have access to Giftastic services.
            </p>
            <p className="text-gray-600">
              If you believe this is a mistake or would like to appeal this decision, please contact our support team.
            </p>
          </div>

          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <h3 className="font-semibold text-gray-800 mb-2">Account Information</h3>
            <p className="text-sm text-gray-600">Email: {email || 'Unavailable'}</p>
            <p className="text-sm text-gray-600 mt-1">Status: <span className="text-red-600 font-semibold">Banned</span></p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <button
              type="button"
              onClick={openSupport}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-all"
            >
              <span className="material-symbols-outlined">mail</span>
              Contact Support
            </button>
            <button
              onClick={handleLogout}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
            >
              Logout
            </button>
          </div>

          <p className="text-xs text-gray-500 text-center pt-4">
            For immediate assistance, email us at <a href="mailto:support@giftastic.com" className="text-primary underline">support@giftastic.com</a>
          </p>
        </div>
      </div>

      {supportOpen && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close support dialog"
            className="absolute inset-0 bg-gray-950/60"
            onClick={() => setSupportOpen(false)}
          />
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="support-dialog-title"
            className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="support-dialog-title" className="text-xl font-bold text-gray-900">Contact Support</h2>
                <p className="mt-2 text-sm text-gray-600">Copy our email or open your preferred email app.</p>
              </div>
              <button
                type="button"
                aria-label="Close support dialog"
                onClick={() => setSupportOpen(false)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <a
              href={`mailto:${supportEmail}`}
              className="mt-5 block rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-center font-semibold text-primary underline"
            >
              {supportEmail}
            </a>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={copySupportEmail}
                className="rounded-xl bg-primary px-4 py-3 font-semibold text-white hover:bg-primary/90"
              >
                Copy Email
              </button>
              <a
                href={supportHref}
                className="rounded-xl border border-primary px-4 py-3 text-center font-semibold text-primary hover:bg-primary/5"
              >
                Open Email App
              </a>
            </div>

            {copyMessage && (
              <p
                role="status"
                aria-live="polite"
                className={`mt-4 text-center text-sm font-medium ${copyMessage.startsWith('Support email copied') ? 'text-green-700' : 'text-amber-700'}`}
              >
                {copyMessage}
              </p>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
