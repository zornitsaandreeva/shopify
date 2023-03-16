const selectors = {
  accountTemplateLogged: '.customer-logged-in',
  account: '.account',
  accountSidebarMobile: '.account-sidebar--mobile',
};

class Account {
  constructor(section) {
    this.section = section;

    this.init();
  }

  init() {
    if (this.section.querySelector(selectors.account)) {
      this.accountMobileSidebar();
    }
  }

  accountMobileSidebar() {
    if (this.section.querySelector(selectors.accountSidebarMobile)) {
      this.section.querySelector(selectors.accountSidebarMobile).addEventListener('click', function () {
        const nextElem = this.nextElementSibling;

        if (nextElem && nextElem.tagName === 'UL') {
          nextElem.classList.toggle('visible');
        }
      });
    }
  }
}

const template = document.querySelector(selectors.accountTemplateLogged);
if (template) {
  new Account(template);
}
