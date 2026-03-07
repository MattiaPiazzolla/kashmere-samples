import { create } from "zustand";
import { persist } from "zustand/middleware";

// ─── Types ────────────────────────────────────────────────────────────────────

export type LicenseType = "ROYALTY_FREE" | "EXCLUSIVE";

export interface CartBeatItem {
  kind: "beat";
  id: string;
  title: string;
  slug: string;
  coverImageUrl: string | null;
  bpm: number | null;
  key: string | null;
  licenseType: LicenseType;
  pricePaid: number;
}

export interface CartPackItem {
  kind: "pack";
  id: string;
  title: string;
  slug: string;
  coverImageUrl: string | null;
  licenseType: LicenseType;
  pricePaid: number;
}

export type CartItem = CartBeatItem | CartPackItem;

function cartKey(item: CartItem): string {
  return `${item.kind}:${item.id}:${item.licenseType}`;
}

// ─── Store ────────────────────────────────────────────────────────────────────

interface CartState {
  items: CartItem[];
  isOpen: boolean;

  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;

  addItem: (item: CartItem) => void;
  removeItem: (id: string, licenseType: LicenseType) => void;
  swapBeatLicense: (
    beatId: string,
    newLicenseType: LicenseType,
    newPrice: number
  ) => void;
  clearCart: () => void;

  total: () => number;
  itemCount: () => number;
  hasItem: (id: string, licenseType?: LicenseType) => boolean;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

      addItem: (incoming) => {
        set((state) => {
          const incomingKey = cartKey(incoming);

          if (incoming.kind === "beat") {
            const withoutSameBeat = state.items.filter(
              (item) => !(item.kind === "beat" && item.id === incoming.id)
            );
            const alreadyExact = withoutSameBeat.some(
              (item) => cartKey(item) === incomingKey
            );
            if (alreadyExact) return state;
            return { items: [...withoutSameBeat, incoming] };
          }

          const alreadyExists = state.items.some(
            (item) => cartKey(item) === incomingKey
          );
          if (alreadyExists) return state;
          return { items: [...state.items, incoming] };
        });
      },

      removeItem: (id, licenseType) => {
        set((state) => ({
          items: state.items.filter(
            (item) => !(item.id === id && item.licenseType === licenseType)
          ),
        }));
      },

      swapBeatLicense: (beatId, newLicenseType, newPrice) => {
        set((state) => ({
          items: state.items.map((item) => {
            if (item.kind === "beat" && item.id === beatId) {
              return { ...item, licenseType: newLicenseType, pricePaid: newPrice };
            }
            return item;
          }),
        }));
      },

      clearCart: () => set({ items: [] }),

      total: () =>
        get().items.reduce((sum, item) => sum + item.pricePaid, 0),

      itemCount: () => get().items.length,

      hasItem: (id, licenseType) => {
        const items = get().items;
        if (licenseType) {
          return items.some(
            (item) => item.id === id && item.licenseType === licenseType
          );
        }
        return items.some((item) => item.id === id);
      },
    }),
    {
      name: "kashmere-cart",
      partialize: (state) => ({ items: state.items }),
    }
  )
);