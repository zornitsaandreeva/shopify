import {register} from '../vendor/theme-scripts/theme-sections';
import {tooltipSection} from '../features/tooltip';
import parallaxHero from '../features/parallax-hero';
import accordions from '../features/accordion';

register('article', [tooltipSection, parallaxHero, accordions]);
