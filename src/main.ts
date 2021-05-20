import App from './App.svelte';

const app = new App({
  target: document.body,
  props: {
    name: 'world',
    orderId: 'order1',
    secret: 'xyz',
    amount: 15,
    mintAddress: '7GDLmV5Kc6V8UggJjrsiJi8RkxkYwCypcdzmvkgg57mP',
  },
});

export default app;
