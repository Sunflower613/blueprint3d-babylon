export const furnitureImageLoaders = import.meta.glob('../src/furniture/image/*.png', {
  query: '?url',
  import: 'default'
});
