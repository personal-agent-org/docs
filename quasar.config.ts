import { defineConfig } from '#q-app';

export default defineConfig(() => ({
  boot: ['i18n'],
  css: ['app.scss'],
  extras: ['material-icons'],
  build: {
    target: {
      browser: ['es2022', 'firefox115', 'chrome115', 'safari14'],
      node: 'node22',
    },
    typescript: {
      strict: true,
      vueShim: true,
    },
    vueRouterMode: 'history',
  },
  devServer: {
    open: false,
    port: 9000,
  },
  framework: {
    iconSet: 'material-icons',
    config: {
      lang: {
        noHtmlAttrs: true,
      },
      brand: {
        primary: '#78a9ff',
        secondary: '#74f0c4',
        accent: '#c5a3ff',
        dark: '#07111f',
      },
    },
    plugins: ['Meta'],
  },
  animations: ['fadeIn', 'fadeInUp'],
  ssg: {
    ssgRendererDirectoryIndexes: true,
    error404HtmlFilename: '404.html',
  },
}));
