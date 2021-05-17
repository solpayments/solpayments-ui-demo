import App from './App.svelte';

const app = new App({
  target: document.body,
  props: {
    name: 'world',
    orderId: '1235',
    secret: 'xyz',
    amount: 17,
    mintAddress: '93p2SYb8DRdzp9paiNUKKSiczQLcfK4j2CAGdnftTcCV',
  },
});

export default app;
