import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import GiftFlowModalController from '../components/controllers/GiftFlowModalController';
import { giftFlowService } from '../services/giftFlowService';
import { favoriteService } from '../services/favoriteService';
import { useAuthStore } from '../store/useAuthStore';
import { toast } from 'react-hot-toast';
import { Heart } from 'lucide-react';
import {
  buildGiftFlowAccess,
  GiftFlowSummary,
  GIFT_FLOW_CONTEXT,
} from '../ui/entities/giftFlow';
import { adaptEntityFromNamedSource } from '../ui/entities/namedAdapters';

export default function GiftFlowCatalog() {
  const viewer = useAuthStore((state) => state.viewer);
  const [flows, setFlows] = useState([]);
  const [selectedFlow, setSelectedFlow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchFlows = async () => {
      try {
        const response = await giftFlowService.getAllFlows();
        setFlows((response || []).map((flow) =>
          adaptEntityFromNamedSource('adaptGiftFlowResponse', flow)));
      } catch (err) {
        setError('Failed to load gift flows. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchFlows();
  }, []);

  const toggleFlowFavorite = async (e, flowId) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await favoriteService.addFlowFavorite(flowId);
      toast.success('Added flow to favorites!');
    } catch (error) {
      toast.error('Failed to add flow to favorites');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-12 py-16 flex-grow w-full">
        <header className="mb-12">
          <h1 className="font-display-xl text-display-xl text-primary mb-4">Curated Gift Flows</h1>
          <p className="text-secondary text-lg max-w-2xl">
            Experience our hand-picked selection of curated gift journeys. 
            Choose a flow that speaks to you and customize it to create the perfect moment.
          </p>
        </header>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="text-center py-20 text-error bg-white rounded-xl border border-surface-container">
            {error}
          </div>
        ) : flows.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border-2 border-dashed border-stone-200">
            <p className="text-secondary text-lg">No gift flows available at the moment. Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {flows.map((flow) => (
              <GiftFlowSummary
                key={flow.id}
                flow={flow}
                access={buildGiftFlowAccess({ flow, viewer, context: GIFT_FLOW_CONTEXT.PUBLIC })}
                to={`/gift-flow/${flow.id}/customize`}
                onPreview={setSelectedFlow}
                favoriteAction={(
                  <button
                    type="button"
                    aria-label={`Add ${flow.name} to favorites`}
                    onClick={(event) => toggleFlowFavorite(event, flow.id)}
                    className="flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-on-surface-variant shadow-sm hover:text-error"
                  >
                    <Heart className="h-5 w-5" />
                  </button>
                )}
              />
            ))}
          </div>
        )}
      </main>

      <GiftFlowModalController
        isOpen={!!selectedFlow}
        flow={selectedFlow}
        viewer={viewer}
        onClose={() => setSelectedFlow(null)}
        showPublicLink={Boolean(selectedFlow?.id)}
      />

      <Footer />
    </div>
  );
}
