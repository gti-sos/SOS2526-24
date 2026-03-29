import adapter from '@sveltejs/adapter-node';

/** @type {import('@sveltejs/kit').Config} */
const config = {
    kit: {
        // El adaptador va dentro de kit
        adapter: adapter({
            out: 'build'
        })
    }, // <--- ESTA LLAVE CIERRA EL KIT. Es la que faltaba.

    // vitePlugin va fuera de kit, al mismo nivel
    vitePlugin: {
        dynamicCompileOptions: ({ filename }) =>
            filename.includes('node_modules') ? undefined : { runes: true }
    }
};

export default config;