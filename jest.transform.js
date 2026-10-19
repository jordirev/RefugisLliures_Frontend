/**
 * Transformer de Jest: babel-jest + substitució d'`import.meta.url`.
 *
 * msw 3 (@mswjs/interceptors) només es publica com a ESM i carrega el seu binari WASM amb
 * `import.meta.url`, que no existeix quan Jest executa el codi com a CommonJS. El substituïm
 * per la URL `file://` del fitxer actual (`__filename`) abans de passar-lo a Babel.
 */
const babelJest = require('babel-jest').default;

const transformer = babelJest.createTransformer({ configFile: './babel.config.js' });

module.exports = {
  ...transformer,
  process(sourceText, sourcePath, options) {
    const patched = sourceText.includes('import.meta.url')
      ? sourceText.replace(/import\.meta\.url/g, "require('url').pathToFileURL(__filename).href")
      : sourceText;
    return transformer.process(patched, sourcePath, options);
  },
  getCacheKey(sourceText, sourcePath, options) {
    return `${transformer.getCacheKey(sourceText, sourcePath, options)}:meta-url-v1`;
  },
};
