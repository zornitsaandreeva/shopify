import {register} from '../vendor/theme-scripts/theme-sections';
import {slider} from '../features/slider';
import {videoPlay} from '../features/video-play';
import {videoBackground} from './video-background';
import parallaxHero from '../features/parallax-hero';
import {QuickAddProduct} from '../features/quick-add-product';
import {swatchGridSection} from '../features/swatch';
import {siblings} from '../features/siblings';
import {compareImages} from '../features/compare-images';
import {newsletterCheckForResultSection} from '../globals/newsletter';

register('custom-content', [slider, videoPlay, videoBackground, parallaxHero, swatchGridSection, compareImages, newsletterCheckForResultSection, siblings]);

if (!customElements.get('quick-add-product')) {
  customElements.define('quick-add-product', QuickAddProduct);
}
