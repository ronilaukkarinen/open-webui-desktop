<script lang="ts">
	import { WEBUI_BASE_URL } from '$lib/stores';
	import Layout from './Layout.svelte';
</script>

{#key $WEBUI_BASE_URL}
	<Layout>
		<slot />
	</Layout>
{/key}
