import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  query, 
  where, 
  deleteDoc, 
  onSnapshot 
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from './firebase';

export interface FirestoreFarmPlot {
  id: string;
  userId: string;
  name: string;
  crop: string;
  area_acres: number;
  coordinates: { lat: number; lng: number }[];
  gut_number?: string;
  health?: string;
  ndvi?: number;
  soil_type?: string;
  createdAt: string;
}

export interface FirestoreMarketListing {
  id: string;
  userId: string;
  seller_name: string;
  crop: string;
  variety?: string;
  quantity_quintals: number;
  price_per_quintal: number;
  mandi: string;
  quality_grade?: string;
  status: string;
  createdAt: string;
}

export const firestoreService = {
  // --- PLOTS ---
  async getPlots(userId: string): Promise<FirestoreFarmPlot[]> {
    const path = 'plots';
    try {
      const q = query(collection(db, path), where('userId', '==', userId));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => ({ ...d.data(), id: d.id } as FirestoreFarmPlot));
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, path);
      return [];
    }
  },

  async savePlot(plot: Omit<FirestoreFarmPlot, 'userId' | 'createdAt'>): Promise<FirestoreFarmPlot> {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('Authentication required to persist farm boundaries');
    const path = 'plots';
    const plotId = plot.id || `plot_${Date.now()}`;
    const fullPlot: FirestoreFarmPlot = {
      ...plot,
      id: plotId,
      userId,
      createdAt: new Date().toISOString()
    };
    try {
      await setDoc(doc(db, path, plotId), fullPlot);
      return fullPlot;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `${path}/${plotId}`);
      throw err;
    }
  },

  async deletePlot(plotId: string): Promise<void> {
    const path = 'plots';
    try {
      await deleteDoc(doc(db, path, plotId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `${path}/${plotId}`);
    }
  },

  subscribePlots(userId: string, onUpdate: (plots: FirestoreFarmPlot[]) => void): () => void {
    const path = 'plots';
    const q = query(collection(db, path), where('userId', '==', userId));
    return onSnapshot(q, (snapshot) => {
      const plots = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as FirestoreFarmPlot));
      onUpdate(plots);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, path);
    });
  },

  // --- MARKETPLACE LISTINGS ---
  async getListings(): Promise<FirestoreMarketListing[]> {
    const path = 'market_listings';
    try {
      const snapshot = await getDocs(collection(db, path));
      return snapshot.docs.map(d => ({ ...d.data(), id: d.id } as FirestoreMarketListing));
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, path);
      return [];
    }
  },

  async createListing(listing: Omit<FirestoreMarketListing, 'id' | 'userId' | 'createdAt'>): Promise<FirestoreMarketListing> {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('Must be signed in to list produce');
    const path = 'market_listings';
    const listingId = `list_${Date.now()}`;
    const fullListing: FirestoreMarketListing = {
      ...listing,
      id: listingId,
      userId,
      createdAt: new Date().toISOString()
    };
    try {
      await setDoc(doc(db, path, listingId), fullListing);
      return fullListing;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `${path}/${listingId}`);
      throw err;
    }
  }
};
