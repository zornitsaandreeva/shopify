/**
 * FeaturedVideo Template Script
 * ------------------------------------------------------------------------------
 * A file that contains scripts highly couple code to the FeaturedVideo template.
 *
 * @namespace FeaturedVideo
 */

import {register} from '../vendor/theme-scripts/theme-sections';
import {videoPlay} from '../features/video-play';
import parallaxHero from '../features/parallax-hero';

import {videoBackground} from './video-background';

register('featured-video', [videoPlay, videoBackground, parallaxHero]);
