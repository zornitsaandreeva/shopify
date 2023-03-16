import {register} from '../vendor/theme-scripts/theme-sections';
import accordions from '../features/accordion';
import scrollToElement from '../features/scroll-to-element';
import scrollSpy from '../features/scroll-spy';

register('sidebar', [accordions, scrollToElement, scrollSpy]);
