// super-simple in-memory KV cache so the API route compiles in dev
const store = new Map<string, { value: any; exp: number }>();

export const KV = {
  async get(key: string) {
    const item = store.get(key);
    if (!item) return null;
    if (Date.now() > item.exp) {
      store.delete(key);
      return null;
    }
    return item.value;
  },
  async set(key: string, value: any, { ex }: { ex: number }) {
    store.set(key, { value, exp: Date.now() + ex * 1000 });
  },
};