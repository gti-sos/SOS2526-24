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
	:global(html, body) {
		margin: 0;
		padding: 0;
		min-height: 100%;
	}

	:global(body) {
		font-family:
			"Cascadia Code",
			"Cascadia Mono",
			"Consolas",
			"Lucida Console",
			monospace;
		background: linear-gradient(180deg, #edf3ef 0%, #ddebe4 40%, #cfe2d8 100%);
		color: #16302c;
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