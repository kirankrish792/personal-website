/** Runs once per visit (the ClientRouter keeps this module alive across page swaps). */
import { initMotionState } from '~/motion/state';
import { initChrome } from '~/motion/chrome';
import { initSmoothScroll } from '~/motion/scroll';
import { initMicro } from '~/motion/micro';
import { initCompanies } from '~/motion/companies';
import { initHero } from '~/motion/hero';
import { initArticle } from '~/motion/article';

initMotionState();
initChrome();
initSmoothScroll();
initMicro();
initCompanies();
initHero();
initArticle();
