import App from './App.svelte';

const app = new App({
  target: document.body,
  props: {
    name: 'world',
    orderId: 'order1',
    secret: 'xyz',
    amount: 15,
    mintAddress: 'ERremgVDpWm4Nk4fdFPgztVUNpyBLXCUpeQXxSRd2RYC',
  },
});

export default app;
