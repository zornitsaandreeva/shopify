import {formatMoney} from '@shopify/theme-currency';

const selectors = {
  saleClass: 'sale',
  soldClass: 'sold-out',
  doubleImage: 'double__image',
};

export function formatPrices(product) {
  // Append classes for on sale and sold out
  const on_sale = product.price <= product.compare_at_price_min;
  let classes = on_sale ? selectors.saleClass : '';
  classes += product.available ? '' : selectors.soldClass;
  // Add 'from' before min price if price varies
  product.price = product.price === 0 ? window.theme.strings.free : formatMoney(product.price, theme.moneyFormat);
  product.price_with_from = product.price;
  if (product.price_varies) {
    const min = product.price_min === 0 ? window.theme.strings.free : formatMoney(product.price_min, theme.moneyFormat);
    product.price_with_from = `<small>${window.theme.strings.from}</small> ${min}`;
  }

  // add a class if there's more than one media
  let double_class = '';
  if (product.media !== undefined) {
    if (product.media.length > 1) {
      double_class += selectors.doubleImage;
    }
  }

  const formatted = {
    ...product,
    classes,
    on_sale,
    double_class,
    sold_out: !product.available,
    sold_out_translation: window.theme.strings.soldOut,
    compare_at_price: formatMoney(product.compare_at_price, theme.moneyFormat),
    compare_at_price_max: formatMoney(product.compare_at_price_max, theme.moneyFormat),
    compare_at_price_min: formatMoney(product.compare_at_price_min, theme.moneyFormat),
    price_max: formatMoney(product.price_max, theme.moneyFormat),
    price_min: formatMoney(product.price_min, theme.moneyFormat),
    unit_price: formatMoney(product.unit_price, theme.moneyWithoutCurrencyFormat),
  };
  return formatted;
}
