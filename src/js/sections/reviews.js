import {register} from '../vendor/theme-scripts/theme-sections';
import accordions from '../features/accordion';
import {slider} from '../features/slider';
import blockScroll from '../features/block-scroll';

register('reviews', [accordions, slider, blockScroll]);
