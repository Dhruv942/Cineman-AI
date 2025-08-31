// Simple visitor counter service
class VisitorCounter {
  private static instance: VisitorCounter;
  private visitorCount: number = 0;
  private isInitialized: boolean = false;

  private constructor() {}

  static getInstance(): VisitorCounter {
    if (!VisitorCounter.instance) {
      VisitorCounter.instance = new VisitorCounter();
    }
    return VisitorCounter.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Try to get stored count from localStorage
      const stored = localStorage.getItem('cineManVisitorCount');
      if (stored) {
        this.visitorCount = parseInt(stored, 10);
      }

      // Increment count for this visit
      this.visitorCount++;
      localStorage.setItem('cineManVisitorCount', this.visitorCount.toString());

      // Simulate real-time updates (in a real app, this would be from a server)
      this.startSimulation();
      
      this.isInitialized = true;
    } catch (error) {
      console.error('Error initializing visitor counter:', error);
    }
  }

  private startSimulation(): void {
    // Simulate live visitor updates every 30 seconds
    setInterval(() => {
      const randomIncrement = Math.floor(Math.random() * 3) + 1; // 1-3 visitors
      this.visitorCount += randomIncrement;
      localStorage.setItem('cineManVisitorCount', this.visitorCount.toString());
      
      // Dispatch custom event for UI updates
      window.dispatchEvent(new CustomEvent('visitorCountUpdate', {
        detail: { count: this.visitorCount }
      }));
    }, 30000); // 30 seconds
  }

  getCount(): number {
    return this.visitorCount;
  }

  // Format number with commas (e.g., 1,234,567)
  getFormattedCount(): string {
    return this.visitorCount.toLocaleString();
  }

  // Get a random visitor count for demo purposes
  getRandomCount(): number {
    const baseCount = 1234;
    const randomOffset = Math.floor(Math.random() * 1000);
    return baseCount + randomOffset;
  }
}

export const visitorCounter = VisitorCounter.getInstance();

// Alternative: Simple function-based approach
export const getVisitorCount = (): number => {
  try {
    const stored = localStorage.getItem('cineManVisitorCount');
    return stored ? parseInt(stored, 10) : 1234;
  } catch {
    return 1234;
  }
};

export const incrementVisitorCount = (): number => {
  try {
    const current = getVisitorCount();
    const newCount = current + 1;
    localStorage.setItem('cineManVisitorCount', newCount.toString());
    return newCount;
  } catch {
    return 1234;
  }
};

export const formatVisitorCount = (count: number): string => {
  return count.toLocaleString();
};
