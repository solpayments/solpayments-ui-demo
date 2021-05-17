import App from './App.svelte';

const app = new App({
  target: document.body,
  props: {
    name: 'world',
    orderId: 'order7',
    secret: 'xyz',
    amount: 15000,
    mintAddress: 'BLLmzN8pcNJ4CswC1Mq9q5sEi95VQz3kyzCtKgEPv4Wk',
  },
});

export default app;
