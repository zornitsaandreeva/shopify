import * as themeAddresses from '@shopify/theme-addresses';
import * as themeCurrency from '@shopify/theme-currency';
import * as themeImages from '@shopify/theme-images';
import MicroModal from 'micromodal';
import Flickity from 'flickity/js/index';
import FlickityFade from 'flickity-fade/flickity-fade';
import Rellax from 'rellax';
import * as BodyScrollLock from 'body-scroll-lock';

if (window.performance) {
  performance.mark('render');

  try {
    window.fastNetworkAndCPU = performance.measure('initialization', 'init', 'render').duration < 500 && performance.measure('initialization', 'init', 'render').startTime < 2000;
  } catch {
    console.warn('performance.measure is not supported by the browser');
  }
}

export {themeAddresses, themeCurrency, themeImages, MicroModal, Flickity, FlickityFade, Rellax, BodyScrollLock};
