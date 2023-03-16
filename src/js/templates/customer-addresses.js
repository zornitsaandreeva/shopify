const selectors = {
  templateAddresses: '.template-addresses',
  addressNewForm: '#AddressNewForm',
  btnNew: '.address-new-toggle',
  btnEdit: '.address-edit-toggle',
  btnDelete: '.address-delete',
  dataFormId: 'data-form-id',
  dataConfirmMessage: 'data-confirm-message',
  editAddress: '#EditAddress',
  addressCountryNew: 'AddressCountryNew',
  addressProvinceNew: 'AddressProvinceNew',
  addressProvinceContainerNew: 'AddressProvinceContainerNew',
  addressCountryOption: '.address-country-option',
  addressCountry: 'AddressCountry',
  addressProvince: 'AddressProvince',
  addressProvinceContainer: 'AddressProvinceContainer',
};

const classes = {
  hidden: 'hidden',
};

class Addresses {
  constructor(section) {
    this.section = section;
    this.addressNewForm = this.section.querySelector(selectors.addressNewForm);

    this.init();
  }

  init() {
    if (this.addressNewForm) {
      const section = this.section;
      const newAddressForm = this.addressNewForm;
      this.customerAddresses();

      const newButtons = section.querySelectorAll(selectors.btnNew);
      if (newButtons.length) {
        newButtons.forEach((element) => {
          element.addEventListener('click', function () {
            newAddressForm.classList.toggle(classes.hidden);
          });
        });
      }

      const editButtons = section.querySelectorAll(selectors.btnEdit);
      if (editButtons.length) {
        editButtons.forEach((element) => {
          element.addEventListener('click', function () {
            const formId = this.getAttribute(selectors.dataFormId);
            section.querySelector(`${selectors.editAddress}_${formId}`).classList.toggle(classes.hidden);
          });
        });
      }

      const deleteButtons = section.querySelectorAll(selectors.btnDelete);
      if (deleteButtons.length) {
        deleteButtons.forEach((element) => {
          element.addEventListener('click', function () {
            const formId = this.getAttribute(selectors.dataFormId);
            const confirmMessage = this.getAttribute(selectors.dataConfirmMessage);
            if (confirm(confirmMessage)) {
              Shopify.postLink(window.theme.routes.addresses_url + '/' + formId, {parameters: {_method: 'delete'}});
            }
          });
        });
      }
    }
  }

  customerAddresses() {
    // Initialize observers on address selectors, defined in shopify_common.js
    if (Shopify.CountryProvinceSelector) {
      new Shopify.CountryProvinceSelector(selectors.addressCountryNew, selectors.addressProvinceNew, {
        hideElement: selectors.addressProvinceContainerNew,
      });
    }

    // Initialize each edit form's country/province selector
    const countryOptions = this.section.querySelectorAll(selectors.addressCountryOption);
    countryOptions.forEach((element) => {
      const formId = element.getAttribute(selectors.dataFormId);
      const countrySelector = `${selectors.addressCountry}_${formId}`;
      const provinceSelector = `${selectors.addressProvince}_${formId}`;
      const containerSelector = `${selectors.addressProvinceContainer}_${formId}`;

      new Shopify.CountryProvinceSelector(countrySelector, provinceSelector, {
        hideElement: containerSelector,
      });
    });
  }
}

const template = document.querySelector(selectors.templateAddresses);
if (template) {
  new Addresses(template);
}
