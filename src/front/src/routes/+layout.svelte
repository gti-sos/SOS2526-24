<script>
  import favicon from '$lib/assets/favicon.svg';
  import Header from './Header.svelte';
  import Footer from './Footer.svelte';

  let { children } = $props();
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
</svelte:head>

<div class="app-shell">
  <Header />

  <main class="main-content">
    {@render children()}
  </main>

  <Footer />
</div>

<style>
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600;700&family=Cormorant+Garamond:wght@500;600;700&display=swap');

  :global(html) {
    scroll-behavior: smooth;
  }

  :global(html, body) {
    margin: 0;
    padding: 0;
    min-height: 100%;
  }

  :global(body) {
    font-family: 'IBM Plex Sans', system-ui, sans-serif;
    color: #2f3a39;
    background: linear-gradient(120deg, #485a57 0%, #6f827e 24%, #9fb0ad 58%, #d2ddd8 100%);
    min-height: 100vh;
    letter-spacing: 0.01em;
  }

  :global(*) {
    box-sizing: border-box;
  }

  .app-shell {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  .main-content {
    flex: 1;
    width: 100%;
  }
</style>