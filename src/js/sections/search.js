import {register} from '../vendor/theme-scripts/theme-sections';
import {swatchGridSection} from '../features/swatch';
import {siblings} from '../features/siblings';
import {QuickAddProduct} from '../features/quick-add-product';

register('search', [swatchGridSection, siblings]);

if (!customElements.get('quick-add-product')) {
  customElements.define('quick-add-product', QuickAddProduct);
}
