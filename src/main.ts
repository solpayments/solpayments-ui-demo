import App from './App.svelte';

const app = new App({
  target: document.body,
  props: {
    name: 'world',
    orderId: 'order7',
    secret: 'xyz',
    amount: 15000,
    mintAddress: 'BrJLmAUQeqymWPfKBhjnAEWYLNvcaUB4cuuGNXyjdsXf',
  },
});

export default app;
