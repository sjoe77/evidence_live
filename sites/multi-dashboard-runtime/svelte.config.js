import evidencePreprocess from '@evidence-dev/preprocess';
import adapter from '@sveltejs/adapter-node';
import { injectComponents } from '@evidence-dev/sdk/build/svelte';
/**
 * Handles errors generated in the Svelte Vite plugin. Temporary approach until this plugin allows errors to be passed through to the browser
 * @param {{ message: string }} warning - The warning object from the Svelte Vite plugin.
 * @throws {Error}
 */
function errorHandler(warning) {
	if (warning.message.includes('defined') || warning.message.includes('Empty Block')) {
		throw new Error(warning.message, { cause: warning });
	}
}

/** @type {import('@sveltejs/kit').Config} */
const config = {
	extensions: ['.svelte', '.md'],
	preprocess: [...evidencePreprocess(true), injectComponents()], // Modify preprocess to allow for loading of $lib instead of package version of components library
	onwarn: errorHandler,
	kit: {
		adapter: adapter({
			out: 'build'
		}),
		files: {
			routes: 'src/pages'
			// lib: 'src/components'
		},
		paths: {
			// Configure for reverse proxy deployment
			relative: false
		},
		csrf: {
			// Allow requests from OAuth proxy
			checkOrigin: false
		}
	}
};

export default config;
