import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ReportButton from '../components/ReportButton';
import { userService } from '../services/userService';
import UserModal from '../components/modals/UserModal';
import { useAuthStore } from '../store/useAuthStore';
import { buildUserAccess, USER_CONTEXT } from '../ui/entities/user';
import { adaptEntityFromNamedSourceWithIdentity } from '../ui/entities/namedAdapters';

export default function PublicUserProfile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const viewer = useAuthStore((state) => state.viewer);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    try {
      const data = await userService.getPublicProfile(userId);
      setProfile(adaptEntityFromNamedSourceWithIdentity('adaptUserPublicProfile', data, 'id', userId));
    } catch {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-on-surface-variant">Loading profile...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <span className="material-symbols-outlined text-6xl text-on-surface-variant mb-4">person_off</span>
            <h2 className="font-headline-md text-headline-md text-on-surface mb-2">User not found</h2>
            <button
              onClick={() => navigate('/')}
              className="text-primary hover:underline"
            >
              Go back home
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const access = buildUserAccess({ user: profile, viewer, context: USER_CONTEXT.PUBLIC });

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="max-w-4xl mx-auto px-6 md:px-12 py-12 flex-grow w-full">
        <div className="mb-6 flex justify-end">
            <ReportButton
              entityType="USER"
              entityId={userId}
              entityName={profile.fullName}
            />
        </div>

        <UserModal
          entity={profile}
          access={access}
        />
      </main>

      <Footer />
    </div>
  );
}
