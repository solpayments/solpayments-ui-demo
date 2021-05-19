import App from './App.svelte';

const app = new App({
  target: document.body,
  props: {
    name: 'world',
    orderId: 'order7',
    secret: 'xyz',
    amount: 15000,
    mintAddress: '8wVXB2gyZjmXCbLEeMQF9K8xho5tWpX5a2Vkxhmj5n84',
  },
});

export default app;
