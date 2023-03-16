import parallaxHero from '../features/parallax-hero';
import {popoutSection} from '../features/popout';
import {newsletterCheckForResultSection} from '../globals/newsletter';
import {register} from '../vendor/theme-scripts/theme-sections';

register('footer', [popoutSection, parallaxHero, newsletterCheckForResultSection]);
