import {defineConfig} from 'vite';
export default defineConfig({base:'./',assetsInclude:['**/*.hdr'],build:{target:'es2022',modulePreload:false,chunkSizeWarningLimit:3500},server:{port:5173,strictPort:false}});
