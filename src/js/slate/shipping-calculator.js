/**
 * Module to add a shipping rates calculator to cart page.
 *
 * Copyright (c) 2011-2012 Caroline Schnapp (11heavens.com)
 * Dual licensed under the MIT and GPL licenses:
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.gnu.org/licenses/gpl.html
 *
 * Modified version -- coupled with Broadcast theme markup
 *
 */

import {AddressForm} from '@shopify/theme-addresses';
import {formatMoney} from '@shopify/theme-currency';

import getUrlString from '../util/get-url-string';
import showElement from '../util/show-element';
import hideElement from '../util/hide-element';
import fadeIn from '../util/fade-in';

if (typeof Shopify.Cart === 'undefined') {
  Shopify.Cart = {};
}

Shopify.Cart.ShippingCalculator = (function () {
  const _config = {
    submitButton: theme.strings.shippingCalcSubmitButton,
    submitButtonDisabled: theme.strings.shippingCalcSubmitButtonDisabled,
    templateId: 'shipping-calculator-response-template',
    wrapperId: 'wrapper-response',
    customerIsLoggedIn: false,
  };
  const _render = function (response) {
    const template = document.querySelector(`#${_config.templateId}`);
    const wrapper = document.querySelector(`#${_config.wrapperId}`);

    if (template && wrapper) {
      wrapper.innerHTML = '';
      let ratesList = '';
      let ratesText = '';
      let successClass = 'error center';
      let markup = template.innerHTML;
      const rateRegex = /[^[\]]+(?=])/g;

      if (response.rates && response.rates.length) {
        let rateTemplate = rateRegex.exec(markup)[0];
        response.rates.forEach((rate) => {
          let rateHtml = rateTemplate;
          rateHtml = rateHtml.replace(/\|\|rateName\|\|/, rate.name);
          rateHtml = rateHtml.replace(/\|\|ratePrice\|\|/, Shopify.Cart.ShippingCalculator.formatRate(rate.price));
          ratesList += rateHtml;
        });
      }

      if (response.success) {
        successClass = 'success center';
        const createdNewElem = document.createElement('div');
        createdNewElem.innerHTML = template.innerHTML;
        const noShippingElem = createdNewElem.querySelector('[data-template-no-shipping]');

        if (response.rates.length < 1 && noShippingElem) {
          ratesText = noShippingElem.getAttribute('data-template-no-shipping');
        }
      } else {
        ratesText = response.errorFeedback;
      }

      markup = markup.replace(rateRegex, '').replace('[]', '');
      markup = markup.replace(/\|\|ratesList\|\|/g, ratesList);
      markup = markup.replace(/\|\|successClass\|\|/g, successClass);
      markup = markup.replace(/\|\|ratesText\|\|/g, ratesText);

      wrapper.innerHTML += markup;
    }
  };
  const _enableButtons = function () {
    const getRatesButton = document.querySelector('.get-rates');
    getRatesButton.removeAttribute('disabled');
    getRatesButton.classList.remove('disabled');
    getRatesButton.value = _config.submitButton;
  };
  const _disableButtons = function () {
    const getRatesButton = document.querySelector('.get-rates');
    getRatesButton.setAttribute('disabled', 'disabled');
    getRatesButton.classList.add('disabled');
    getRatesButton.value = _config.submitButtonDisabled;
  };
  const _getCartShippingRatesForDestination = function (shipping_address) {
    const encodedShippingAddressData = encodeURI(
      getUrlString({
        shipping_address: shipping_address,
      })
    );
    const url = `${window.theme.routes.cart}/shipping_rates.json?${encodedShippingAddressData}`;
    const request = new XMLHttpRequest();
    request.open('GET', url, true);

    request.onload = function () {
      if (this.status >= 200 && this.status < 400) {
        const response = JSON.parse(this.response);
        const rates = response.shipping_rates;
        _onCartShippingRatesUpdate(rates, shipping_address);
      } else {
        _onError(this);
      }
    };

    request.onerror = function () {
      _onError(this);
    };

    request.send();
  };
  const _fullMessagesFromErrors = function (errors) {
    const fullMessages = [];

    for (const error in errors) {
      for (const message of errors[error]) {
        fullMessages.push(error + ' ' + message);
      }
    }

    return fullMessages;
  };
  const _onError = function (XMLHttpRequest) {
    hideElement(document.querySelector('#estimated-shipping'));

    const shippingChild = document.querySelector('#estimated-shipping em');
    if (shippingChild) {
      while (shippingChild.firstChild) shippingChild.removeChild(shippingChild.firstChild);
    }
    _enableButtons();
    let feedback = '';
    const data = eval('(' + XMLHttpRequest.responseText + ')');
    if (data.message) {
      feedback = data.message + '(' + data.status + '): ' + data.description;
    } else {
      feedback = 'Error : ' + _fullMessagesFromErrors(data).join('; ');
    }
    if (feedback === 'Error : country is not supported.') {
      feedback = 'We do not ship to this destination.';
    }
    _render({
      rates: [],
      errorFeedback: feedback,
      success: false,
    });

    showElement(document.querySelector(`#${_config.wrapperId}`));
  };
  const _onCartShippingRatesUpdate = function (rates, shipping_address) {
    _enableButtons();
    let readable_address = '';
    if (shipping_address.zip) {
      readable_address += shipping_address.zip + ', ';
    }
    if (shipping_address.province) {
      readable_address += shipping_address.province + ', ';
    }
    readable_address += shipping_address.country;
    const shippingChild = document.querySelector('#estimated-shipping em');
    if (rates.length && shippingChild) {
      shippingChild.textContent = rates[0].price == '0.00' ? window.theme.strings.free : formatMoney(rates[0].price, theme.moneyFormat);
    }
    _render({
      rates: rates,
      address: readable_address,
      success: true,
    });

    const fadeElements = document.querySelectorAll(`#${_config.wrapperId}, #estimated-shipping`);

    if (fadeElements.length) {
      fadeElements.forEach((element) => {
        fadeIn(element);
      });
    }
  };

  const _init = function () {
    const getRatesButton = document.querySelector('.get-rates');
    const fieldsContainer = document.querySelector('#address_container');
    const selectCountry = document.querySelector('#address_country');
    const selectProvince = document.querySelector('#address_province');
    const htmlEl = document.querySelector('html');
    let locale = 'en';
    if (htmlEl.hasAttribute('lang') && htmlEl.getAttribute('lang') !== '') {
      locale = htmlEl.getAttribute('lang');
    }

    if (fieldsContainer) {
      AddressForm(fieldsContainer, locale, {
        shippingCountriesOnly: true,
      });
    }

    if (selectCountry && selectCountry.hasAttribute('data-default') && selectProvince && selectProvince.hasAttribute('data-default')) {
      selectCountry.addEventListener('change', function () {
        selectCountry.removeAttribute('data-default');
        selectProvince.removeAttribute('data-default');
      });
    }

    if (getRatesButton) {
      getRatesButton.addEventListener('click', function (e) {
        _disableButtons();
        const wrapper = document.querySelector(`#${_config.wrapperId}`);
        while (wrapper.firstChild) wrapper.removeChild(wrapper.firstChild);
        hideElement(wrapper);
        const shippingAddress = {};
        let elemCountryVal = selectCountry.value;
        let elemProvinceVal = selectProvince.value;
        const elemCountryData = selectCountry.getAttribute('data-default-fullname');
        if (elemCountryVal === '' && elemCountryData && elemCountryData !== '') {
          elemCountryVal = elemCountryData;
        }
        const elemProvinceData = selectProvince.getAttribute('data-default-fullname');
        if (elemProvinceVal === '' && elemProvinceData && elemProvinceData !== '') {
          elemProvinceVal = elemProvinceData;
        }
        shippingAddress.zip = document.querySelector('#address_zip').value || '';
        shippingAddress.country = elemCountryVal || '';
        shippingAddress.province = elemProvinceVal || '';
        _getCartShippingRatesForDestination(shippingAddress);
      });

      if (_config.customerIsLoggedIn && getRatesButton.classList.contains('get-rates--trigger')) {
        const zipElem = document.querySelector('#address_zip');
        if (zipElem && zipElem.value) {
          getRatesButton.dispatchEvent(new Event('click'));
        }
      }
    }
  };
  return {
    show: function (params) {
      params = params || {};
      Object.assign(_config, params);
      document.addEventListener('DOMContentLoaded', function () {
        _init();
      });
    },
    getConfig: function () {
      return _config;
    },
    formatRate: function (cents) {
      const price = cents === '0.00' ? window.theme.strings.free : formatMoney(cents, theme.moneyFormat);
      return price;
    },
  };
})();
