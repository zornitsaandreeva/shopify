import {isMobile} from '../util/media-query';

import NativeScrollbar from './native-scrollbar';

const selectors = {
  body: 'body',
  dataRelatedSectionElem: '[data-related-section]',
  dataTabsHolder: '[data-tabs-holder]',
  dataTab: 'data-tab',
  dataTabIndex: 'data-tab-index',
  dataTabStartIndex: 'data-start-index',
  dataTabStartIndexMobile: 'data-start-index-mobile',
  dataAos: '[data-aos]',
  blockId: 'data-block-id',
  tabsLi: '[data-tab]',
  tabLink: '.tab-link',
  tabLinkRecent: '.tab-link__recent',
  tabContent: '.tab-content',
  scrollbarHolder: '[data-scrollbar]',
  productModal: '[data-product-modal]',
};

const classes = {
  current: 'current',
  hidden: 'hidden',
  alt: 'alt',
  aosAnimate: 'aos-animate',
  aosNoTransition: 'aos-no-transition',
  focused: 'is-focused',
};

const sections = {};

class GlobalTabs {
  constructor(holder) {
    this.container = holder;
    this.body = document.querySelector(selectors.body);
    this.accessibility = window.accessibility;

    if (this.container) {
      this.scrollbarHolder = this.container.querySelectorAll(selectors.scrollbarHolder);

      this.init();

      // Init native scrollbar
      this.initNativeScrollbar();
    }
  }

  init() {
    const ctx = this.container;
    const tabsNavList = ctx.querySelectorAll(selectors.tabsLi);
    const startIdx = ctx.hasAttribute(selectors.dataTabStartIndex) ? ctx.getAttribute(selectors.dataTabStartIndex) : 0;
    let firstTabLink = ctx.querySelector(`${selectors.tabLink}-${startIdx}`);
    let firstTabContent = ctx.querySelector(`${selectors.tabContent}-${startIdx}`);

    if (isMobile()) {
      const startIdxMobile = ctx.hasAttribute(selectors.dataTabStartIndexMobile) ? ctx.getAttribute(selectors.dataTabStartIndexMobile) : startIdx;
      firstTabLink = ctx.querySelector(`${selectors.tabLink}-${startIdxMobile}`);
      firstTabContent = ctx.querySelector(`${selectors.tabContent}-${startIdxMobile}`);
    }

    if (firstTabContent) {
      firstTabContent.classList.add(classes.current);
    }

    if (firstTabLink) {
      firstTabLink.classList.add(classes.current);
    }

    this.checkVisibleTabLinks();
    this.container.addEventListener('theme:tab:check', () => this.checkRecentTab());
    this.container.addEventListener('theme:tab:hide', () => this.hideRelatedTab());

    if (tabsNavList.length) {
      tabsNavList.forEach((element) => {
        const tabId = parseInt(element.getAttribute(selectors.dataTab));
        const tab = ctx.querySelector(`${selectors.tabContent}-${tabId}`);

        element.addEventListener('click', () => {
          this.tabChange(element, tab);
        });

        element.addEventListener('keyup', (event) => {
          if ((event.code === window.theme.keyboardKeys.SPACE || event.code === window.theme.keyboardKeys.ENTER) && this.body.classList.contains(classes.focused)) {
            this.tabChange(element, tab);
          }
        });
      });
    }
  }

  tabChange(element, tab) {
    if (element.classList.contains(classes.current)) {
      return;
    }

    this.container.querySelector(`${selectors.tabsLi}.${classes.current}`).classList.remove(classes.current);
    const lastCurrentTab = this.container.querySelector(`${selectors.tabContent}.${classes.current}`);
    lastCurrentTab.classList.remove(classes.current);

    element.classList.add(classes.current);
    tab.classList.add(classes.current);

    if (element.classList.contains(classes.hidden)) {
      tab.classList.add(classes.hidden);
    }

    this.checkVisibleTabLinks();

    this.accessibility.a11y.removeTrapFocus();

    this.container.dispatchEvent(new CustomEvent('theme:tab:change', {bubbles: true}));

    element.dispatchEvent(
      new CustomEvent('theme:form:sticky', {
        bubbles: true,
        detail: {
          element: 'tab',
        },
      })
    );

    this.animateItems(tab);
  }

  animateItems(tab, animated = true) {
    const animatedItems = tab.querySelectorAll(selectors.dataAos);

    if (animatedItems.length) {
      animatedItems.forEach((animatedItem) => {
        animatedItem.classList.remove(classes.aosAnimate);

        if (animated) {
          animatedItem.classList.add(classes.aosNoTransition);

          setTimeout(() => {
            animatedItem.classList.remove(classes.aosNoTransition);
            animatedItem.classList.add(classes.aosAnimate);
          });
        }
      });
    }
  }

  initNativeScrollbar() {
    if (this.scrollbarHolder.length) {
      this.scrollbarHolder.forEach((scrollbar) => {
        new NativeScrollbar(scrollbar);
      });
    }
  }

  checkVisibleTabLinks() {
    const tabsNavList = this.container.querySelectorAll(selectors.tabsLi);
    const tabsNavListHidden = this.container.querySelectorAll(`${selectors.tabLink}.${classes.hidden}`);
    const difference = tabsNavList.length - tabsNavListHidden.length;

    if (difference < 2) {
      this.container.classList.add(classes.alt);
    } else {
      this.container.classList.remove(classes.alt);
    }
  }

  checkRecentTab() {
    const tabLink = this.container.querySelector(selectors.tabLinkRecent);

    if (tabLink) {
      tabLink.classList.remove(classes.hidden);
      const tabLinkIdx = parseInt(tabLink.getAttribute(selectors.dataTab));
      const tabContent = this.container.querySelector(`${selectors.tabContent}[${selectors.dataTabIndex}="${tabLinkIdx}"]`);

      if (tabContent) {
        tabContent.classList.remove(classes.hidden);

        this.animateItems(tabContent, false);
      }

      this.checkVisibleTabLinks();

      this.initNativeScrollbar();
    }
  }

  hideRelatedTab() {
    const relatedSection = this.container.querySelector(selectors.dataRelatedSectionElem);
    if (!relatedSection) {
      return;
    }

    const parentTabContent = relatedSection.closest(`${selectors.tabContent}.${classes.current}`);
    if (!parentTabContent) {
      return;
    }
    const parentTabContentIdx = parseInt(parentTabContent.getAttribute(selectors.dataTabIndex));
    const tabsNavList = this.container.querySelectorAll(selectors.tabsLi);

    if (tabsNavList.length > parentTabContentIdx) {
      const nextTabsNavLink = tabsNavList[parentTabContentIdx].nextSibling;

      if (nextTabsNavLink) {
        tabsNavList[parentTabContentIdx].classList.add(classes.hidden);
        nextTabsNavLink.dispatchEvent(new Event('click'));
        this.initNativeScrollbar();
      }
    }
  }

  onBlockSelect(evt) {
    const element = this.container.querySelector(`${selectors.tabLink}[${selectors.blockId}="${evt.detail.blockId}"]`);
    if (element) {
      element.dispatchEvent(new Event('click'));

      element.parentNode.scrollTo({
        top: 0,
        left: element.offsetLeft - element.clientWidth,
        behavior: 'smooth',
      });
    }
  }
}

const tabs = {
  onLoad() {
    sections[this.id] = [];
    const tabHolders = this.container.querySelectorAll(selectors.dataTabsHolder);

    tabHolders.forEach((holder) => {
      sections[this.id].push(new GlobalTabs(holder));
    });
  },
  onBlockSelect(e) {
    sections[this.id].forEach((el) => {
      if (typeof el.onBlockSelect === 'function') {
        el.onBlockSelect(e);
      }
    });
  },
};

export default tabs;
