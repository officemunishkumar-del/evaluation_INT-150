/**
 * Socket Service
 * Handles WebSocket connections for real-time auction updates.
 * Currently simulates Socket.IO events - replace with actual Socket.IO when integrating.
 */

import { getToken } from "./api";

export type AuctionEventType =
    | "NEW_BID"
    | "AUCTION_ENDING_SOON"
    | "AUCTION_SOLD"
    | "AUCTION_EXPIRED"
    | "VIEWER_COUNT"
    | "CONNECTION_STATE";

export interface NewBidEvent {
    auctionId: string;
    amount: number;
    bidderName: string;
    timestamp: string;
}

export interface AuctionEndingSoonEvent {
    auctionId: string;
    secondsRemaining: number;
}

export interface AuctionSoldEvent {
    auctionId: string;
    winnerName: string;
    finalPrice: number;
}

export interface AuctionExpiredEvent {
    auctionId: string;
}

export interface ViewerCountEvent {
    auctionId: string;
    count: number;
}

export interface ConnectionStateEvent {
    connected: boolean;
    reconnecting: boolean;
    error?: string;
}

export interface AuctionState {
    auctionId: string;
    currentBid: number;
    bidCount: number;
    viewerCount: number;
    status: "active" | "sold" | "expired";
    endsAt: string;
}

type EventCallback = (data: unknown) => void;

class SocketService {
    private connected: boolean = false;
    private reconnecting: boolean = false;
    private reconnectAttempts: number = 0;
    private maxReconnectAttempts: number = 5;
    private reconnectDelay: number = 1000;
    private subscribedAuctions: Set<string> = new Set();
    private eventListeners: Map<string, Set<EventCallback>> = new Map();
    private viewerCounts: Map<string, number> = new Map();
    private simulationIntervals: Map<string, NodeJS.Timeout> = new Map();
    private reconnectTimer: NodeJS.Timeout | null = null;
    private onlineListener: (() => void) | null = null;
    private offlineListener: (() => void) | null = null;

    constructor() {
        // Setup network status listeners
        this.setupNetworkListeners();
    }

    /**
     * Setup network online/offline listeners
     */
    private setupNetworkListeners(): void {
        this.onlineListener = () => {
            console.log("[Socket] Network online, attempting reconnect");
            this.reconnect();
        };

        this.offlineListener = () => {
            console.log("[Socket] Network offline");
            this.handleDisconnect();
        };

        if (typeof window !== "undefined") {
            window.addEventListener("online", this.onlineListener);
            window.addEventListener("offline", this.offlineListener);
        }
    }

    /**
     * Check if browser is online
     */
    isOnline(): boolean {
        return typeof navigator !== "undefined" ? navigator.onLine : true;
    }

    /**
     * Connect to the WebSocket server
     */
    connect(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.isOnline()) {
                this.emitConnectionState(false, false, "Network offline");
                reject(new Error("Network offline"));
                return;
            }

            // Simulate connection delay
            setTimeout(() => {
                const token = getToken();
                if (token) {
                    console.log("[Socket] Connected with auth token");
                } else {
                    console.log("[Socket] Connected (unauthenticated)");
                }
                this.connected = true;
                this.reconnecting = false;
                this.reconnectAttempts = 0;
                this.emitConnectionState(true, false);
                resolve();
            }, 500);
        });
    }

    /**
     * Handle disconnection
     */
    private handleDisconnect(): void {
        this.connected = false;
        this.emitConnectionState(false, false);

        // Clear all simulation intervals
        this.simulationIntervals.forEach(interval => clearInterval(interval));
        this.simulationIntervals.clear();
    }

    /**
     * Disconnect from the WebSocket server
     */
    disconnect(): void {
        this.connected = false;
        this.reconnecting = false;
        this.subscribedAuctions.clear();
        this.simulationIntervals.forEach(interval => clearInterval(interval));
        this.simulationIntervals.clear();

        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }

        this.emitConnectionState(false, false);
        console.log("[Socket] Disconnected");
    }

    /**
     * Reconnect with exponential backoff
     */
    async reconnect(): Promise<void> {
        if (this.reconnecting || this.connected) {
            return;
        }

        this.reconnecting = true;
        this.emitConnectionState(false, true);

        while (this.reconnectAttempts < this.maxReconnectAttempts && !this.connected) {
            this.reconnectAttempts++;
            const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

            console.log(`[Socket] Reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);

            await new Promise(resolve => {
                this.reconnectTimer = setTimeout(resolve, delay);
            });

            try {
                await this.connect();

                // Re-subscribe to all previously subscribed auctions
                const auctionsToResubscribe = [...this.subscribedAuctions];
                this.subscribedAuctions.clear();

                for (const auctionId of auctionsToResubscribe) {
                    this.subscribeToAuction(auctionId);
                    // Fetch current state to avoid missed events
                    await this.fetchAuctionState(auctionId);
                }

                console.log("[Socket] Reconnected successfully");
                return;
            } catch (error) {
                console.log(`[Socket] Reconnect attempt ${this.reconnectAttempts} failed`);
            }
        }

        this.reconnecting = false;
        this.emitConnectionState(false, false, "Max reconnect attempts reached");
        console.log("[Socket] Max reconnect attempts reached");
    }

    /**
     * Fetch current auction state after reconnect to avoid missed events
     */
    async fetchAuctionState(auctionId: string): Promise<AuctionState | null> {
        // In real implementation, this would fetch from the server
        // For now, simulate with mock data
        console.log(`[Socket] Fetching state for auction:${auctionId}`);

        // Mock state - in production, call API endpoint
        const mockState: AuctionState = {
            auctionId,
            currentBid: 6500 + Math.floor(Math.random() * 1000),
            bidCount: 12 + Math.floor(Math.random() * 5),
            viewerCount: this.viewerCounts.get(auctionId) || 5,
            status: "active",
            endsAt: new Date(Date.now() + 3600000).toISOString(),
        };

        // Emit state update
        this.emit("NEW_BID", {
            auctionId,
            amount: mockState.currentBid,
            bidderName: "Reconnect Sync",
            timestamp: new Date().toISOString(),
        });

        return mockState;
    }

    /**
     * Emit connection state change
     */
    private emitConnectionState(connected: boolean, reconnecting: boolean, error?: string): void {
        this.emit("CONNECTION_STATE", { connected, reconnecting, error });
    }

    /**
     * Subscribe to an auction room
     */
    subscribeToAuction(auctionId: string): void {
        if (!this.connected) {
            console.warn("[Socket] Not connected, cannot subscribe");
            // Store for later subscription after reconnect
            this.subscribedAuctions.add(auctionId);
            return;
        }

        if (this.subscribedAuctions.has(auctionId)) {
            return;
        }

        this.subscribedAuctions.add(auctionId);

        // Initialize viewer count
        const initialCount = Math.floor(Math.random() * 20) + 5;
        this.viewerCounts.set(auctionId, initialCount);

        // Emit initial viewer count
        this.emit("VIEWER_COUNT", { auctionId, count: initialCount });

        // Simulate viewer count updates
        const interval = setInterval(() => {
            const currentCount = this.viewerCounts.get(auctionId) || 0;
            const change = Math.random() > 0.5 ? 1 : -1;
            const newCount = Math.max(1, Math.min(currentCount + change, 50));
            this.viewerCounts.set(auctionId, newCount);
            this.emit("VIEWER_COUNT", { auctionId, count: newCount });
        }, 5000 + Math.random() * 5000);

        this.simulationIntervals.set(auctionId, interval);

        console.log(`[Socket] Subscribed to auction:${auctionId}`);
    }

    /**
     * Unsubscribe from an auction room
     */
    unsubscribeFromAuction(auctionId: string): void {
        this.subscribedAuctions.delete(auctionId);
        this.viewerCounts.delete(auctionId);

        const interval = this.simulationIntervals.get(auctionId);
        if (interval) {
            clearInterval(interval);
            this.simulationIntervals.delete(auctionId);
        }

        console.log(`[Socket] Unsubscribed from auction:${auctionId}`);
    }

    /**
     * Listen for events
     */
    on(event: AuctionEventType, callback: EventCallback): void {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, new Set());
        }
        this.eventListeners.get(event)!.add(callback);
    }

    /**
     * Remove event listener
     */
    off(event: AuctionEventType, callback: EventCallback): void {
        this.eventListeners.get(event)?.delete(callback);
    }

    /**
     * Emit an event locally (for simulation)
     */
    private emit(event: AuctionEventType, data: unknown): void {
        this.eventListeners.get(event)?.forEach(callback => callback(data));
    }

    /**
     * Simulate a new bid event (for testing)
     */
    simulateNewBid(auctionId: string, amount: number): void {
        const names = ["John D.", "Sarah M.", "Mike R.", "Emma L."];
        const event: NewBidEvent = {
            auctionId,
            amount,
            bidderName: names[Math.floor(Math.random() * names.length)],
            timestamp: new Date().toISOString(),
        };
        this.emit("NEW_BID", event);
    }

    /**
     * Check if connected
     */
    isConnected(): boolean {
        return this.connected;
    }

    /**
     * Check if reconnecting
     */
    isReconnecting(): boolean {
        return this.reconnecting;
    }

    /**
     * Cleanup on unmount
     */
    cleanup(): void {
        if (typeof window !== "undefined") {
            if (this.onlineListener) {
                window.removeEventListener("online", this.onlineListener);
            }
            if (this.offlineListener) {
                window.removeEventListener("offline", this.offlineListener);
            }
        }
        this.disconnect();
    }
}

// Singleton instance
export const socketService = new SocketService();
