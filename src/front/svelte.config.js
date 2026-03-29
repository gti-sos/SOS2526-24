import adapter from '@sveltejs/adapter-node';

/** @type {import('@sveltejs/kit').Config} */
const config = {
    kit: { 
        adapter: adapter({
            // Esto asegura que se cree la carpeta 'build' dentro de 'src/front'
            out: 'build' 
        }) 
    ,
    vitePlugin: {
        dynamicCompileOptions: ({ filename }) =>
            filename.includes('node_modules') ? undefined : { runes: true }
    }
}
};

export default config;