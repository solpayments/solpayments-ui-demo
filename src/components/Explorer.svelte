<script lang="ts">
  export let transactionId: string;
  export let baseUrl: string = 'https://explorer.solana.com';
  export let networkUrl: string;
  let url: string = `${baseUrl}/tx/${transactionId}?cluster=custom&customUrl=${networkUrl}`;
</script>

<p><a href={url} target="_blank">View on Solana</a></p>
