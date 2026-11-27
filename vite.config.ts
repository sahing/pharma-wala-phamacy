import fs from 'fs';
import path from 'path';
import {defineConfig} from 'vite';

const htmlPages = {
  main: path.resolve(__dirname, 'index.html'),
  shop: path.resolve(__dirname, 'shop.html'),
  product: path.resolve(__dirname, 'product.html'),
  prescription: path.resolve(__dirname, 'prescription.html'),
  clinic: path.resolve(__dirname, 'clinic.html'),
  about: path.resolve(__dirname, 'about.html'),
  contact: path.resolve(__dirname, 'contact.html'),
  privacy: path.resolve(__dirname, 'policies/privacy.html'),
  terms: path.resolve(__dirname, 'policies/terms.html'),
  returns: path.resolve(__dirname, 'policies/returns.html'),
  delivery: path.resolve(__dirname, 'policies/delivery.html'),
};

export default defineConfig(() => {
  return {
    plugins: [
      {
        name: 'copy-static-pharmacy-assets',
        apply: 'build',
        closeBundle(error?: Error): void {
          if (error) {
            return;
          }
          const distDir = path.resolve(__dirname, 'dist');
          if (!fs.existsSync(distDir)) {
            return;
          }
          for (const dirName of ['data', 'images']) {
            const srcDir = path.resolve(__dirname, dirName);
            const destDir = path.resolve(distDir, dirName);
            if (fs.existsSync(srcDir)) {
              fs.cpSync(srcDir, destDir, {recursive: true, force: true});
            }
          }
          for (const fileName of ['sitemap.xml', 'robots.txt']) {
            const srcFile = path.resolve(__dirname, fileName);
            const destFile = path.resolve(distDir, fileName);
            if (fs.existsSync(srcFile)) {
              fs.copyFileSync(srcFile, destFile);
            }
          }
        },
      },
    ],
    build: {
      rollupOptions: {
        input: htmlPages,
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
