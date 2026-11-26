import Product from '../product/Product';

/**
 * Shared product row/track used by live carousels, inline home grids and the
 * Design Studio preview. Consumers can override the renderer for preview-only
 * placeholder cards, but the wrapper/grid geometry stays identical everywhere.
 */
export default function ProductRow({
  products = [],
  col = 3,
  renderProduct,
  trackRef,
  trackClassName = '',
}) {
  return (
    <div className="product-scroll">
      <div className={`product-scroll-track ${trackClassName}`.trim()} ref={trackRef}>
        {products.map((product, index) => (
          renderProduct
            ? renderProduct(product, index)
            : (
              <Product
                key={product._id || `${product.name || 'product'}-${index}`}
                product={product}
                col={col}
                index={index}
              />
            )
        ))}
      </div>
    </div>
  );
}
