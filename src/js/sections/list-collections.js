import {register} from '../vendor/theme-scripts/theme-sections';
import {slider} from '../features/slider';
import {QuickAddProduct} from '../features/quick-add-product';
import {swatchGridSection} from '../features/swatch';
import {siblings} from '../features/siblings';
import blockScroll from '../features/block-scroll';

register('list-collections', [slider, swatchGridSection, blockScroll, siblings]);

if (!customElements.get('quick-add-product')) {
  customElements.define('quick-add-product', QuickAddProduct);
}
