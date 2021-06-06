import App from './App.svelte';

const app = new App({
  target: document.body,
  props: {
    mintAddress: 'So11111111111111111111111111111111111111112',
  },
});

export default app;
