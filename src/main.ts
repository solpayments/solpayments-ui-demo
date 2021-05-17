import App from './App.svelte';

const app = new App({
  target: document.body,
  props: {
    name: 'world',
    orderId: '1235',
    secret: 'xyz',
    amount: 17,
    mintAddress: '6fS4RH53gjQCYQyZfzEVjvoMoCGMhRbR6Qxogo2LdvoW',
  },
});

export default app;
