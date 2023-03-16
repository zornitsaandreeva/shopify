window.Shopify = window.Shopify || {};
window.Shopify.theme = window.Shopify.theme || {};
window.Shopify.theme.sections = window.Shopify.theme.sections || {};

window.Shopify.theme.sections.registered = window.Shopify.theme.sections.registered || {};
window.Shopify.theme.sections.instances = window.Shopify.theme.sections.instances || [];
const registered = window.Shopify.theme.sections.registered;
const instances = window.Shopify.theme.sections.instances;

const selectors = {
  id: 'data-section-id',
  type: 'data-section-type',
};

class Registration {
  constructor(type = null, components = []) {
    this.type = type;
    this.components = validateComponentsArray(components);
    this.callStack = {
      onLoad: [],
      onUnload: [],
      onSelect: [],
      onDeselect: [],
      onBlockSelect: [],
      onBlockDeselect: [],
      onReorder: [],
    };
    components.forEach((comp) => {
      for (const [key, value] of Object.entries(comp)) {
        const arr = this.callStack[key];
        if (Array.isArray(arr) && typeof value === 'function') {
          arr.push(value);
        } else {
          console.warn(`Unregisted function: '${key}' in component: '${this.type}'`);
          console.warn(value);
        }
      }
    });
  }

  getStack() {
    return this.callStack;
  }
}

class Section {
  constructor(container, registration) {
    this.container = validateContainerElement(container);
    this.id = container.getAttribute(selectors.id);
    this.type = registration.type;
    this.callStack = registration.getStack();

    try {
      this.onLoad();
    } catch (e) {
      console.warn(`Error in section: ${this.id}`);
      console.warn(this);
      console.warn(e);
    }
  }

  callFunctions(key, e = null) {
    this.callStack[key].forEach((func) => {
      const props = {
        id: this.id,
        type: this.type,
        container: this.container,
      };
      if (e) {
        func.call(props, e);
      } else {
        func.call(props);
      }
    });
  }

  onLoad() {
    this.callFunctions('onLoad');
  }

  onUnload() {
    this.callFunctions('onUnload');
  }

  onSelect(e) {
    this.callFunctions('onSelect', e);
  }

  onDeselect(e) {
    this.callFunctions('onDeselect', e);
  }

  onBlockSelect(e) {
    this.callFunctions('onBlockSelect', e);
  }

  onBlockDeselect(e) {
    this.callFunctions('onBlockDeselect', e);
  }

  onReorder(e) {
    this.callFunctions('onReorder', e);
  }
}

function validateContainerElement(container) {
  if (!(container instanceof Element)) {
    throw new TypeError('Theme Sections: Attempted to load section. The section container provided is not a DOM element.');
  }
  if (container.getAttribute(selectors.id) === null) {
    throw new Error('Theme Sections: The section container provided does not have an id assigned to the ' + selectors.id + ' attribute.');
  }

  return container;
}

function validateComponentsArray(value) {
  if ((typeof value !== 'undefined' && typeof value !== 'object') || value === null) {
    throw new TypeError('Theme Sections: The components object provided is not a valid');
  }

  return value;
}

/*
 * @shopify/theme-sections
 * -----------------------------------------------------------------------------
 *
 * A framework to provide structure to your Shopify sections and a load and unload
 * lifecycle. The lifecycle is automatically connected to theme editor events so
 * that your sections load and unload as the editor changes the content and
 * settings of your sections.
 */

function register(type, components) {
  if (typeof type !== 'string') {
    throw new TypeError('Theme Sections: The first argument for .register must be a string that specifies the type of the section being registered');
  }

  if (typeof registered[type] !== 'undefined') {
    throw new Error('Theme Sections: A section of type "' + type + '" has already been registered. You cannot register the same section type twice');
  }

  if (!Array.isArray(components)) {
    components = [components];
  }

  const section = new Registration(type, components);
  registered[type] = section;

  return registered;
}

function unregister(types) {
  types = normalizeType(types);

  types.forEach(function (type) {
    delete registered[type];
  });
}

function load(types, containers) {
  types = normalizeType(types);

  if (typeof containers === 'undefined') {
    containers = document.querySelectorAll('[' + selectors.type + ']');
  }

  containers = normalizeContainers(containers);

  types.forEach(function (type) {
    const registration = registered[type];

    if (typeof registration === 'undefined') {
      return;
    }

    containers = containers.filter(function (container) {
      // Filter from list of containers because container already has an instance loaded
      if (isInstance(container)) {
        return false;
      }

      // Filter from list of containers because container doesn't have data-section-type attribute
      if (container.getAttribute(selectors.type) === null) {
        return false;
      }

      // Keep in list of containers because current type doesn't match
      if (container.getAttribute(selectors.type) !== type) {
        return true;
      }

      instances.push(new Section(container, registration));

      // Filter from list of containers because container now has an instance loaded
      return false;
    });
  });
}

function reorder(selector) {
  var instancesToReorder = getInstances(selector);

  instancesToReorder.forEach(function (instance) {
    instance.onReorder();
  });
}

function unload(selector) {
  var instancesToUnload = getInstances(selector);

  instancesToUnload.forEach(function (instance) {
    var index = instances
      .map(function (e) {
        return e.id;
      })
      .indexOf(instance.id);
    instances.splice(index, 1);
    instance.onUnload();
  });
}

function getInstances(selector) {
  var filteredInstances = [];

  // Fetch first element if its an array
  if (NodeList.prototype.isPrototypeOf(selector) || Array.isArray(selector)) {
    var firstElement = selector[0];
  }

  // If selector element is DOM element
  if (selector instanceof Element || firstElement instanceof Element) {
    var containers = normalizeContainers(selector);

    containers.forEach(function (container) {
      filteredInstances = filteredInstances.concat(
        instances.filter(function (instance) {
          return instance.container === container;
        })
      );
    });

    // If select is type string
  } else if (typeof selector === 'string' || typeof firstElement === 'string') {
    var types = normalizeType(selector);

    types.forEach(function (type) {
      filteredInstances = filteredInstances.concat(
        instances.filter(function (instance) {
          return instance.type === type;
        })
      );
    });
  }

  return filteredInstances;
}

function getInstanceById(id) {
  var instance;

  for (var i = 0; i < instances.length; i++) {
    if (instances[i].id === id) {
      instance = instances[i];
      break;
    }
  }
  return instance;
}

function isInstance(selector) {
  return getInstances(selector).length > 0;
}

function normalizeType(types) {
  // If '*' then fetch all registered section types
  if (types === '*') {
    types = Object.keys(registered);

    // If a single section type string is passed, put it in an array
  } else if (typeof types === 'string') {
    types = [types];

    // If single section constructor is passed, transform to array with section
    // type string
  } else if (types.constructor === Section) {
    types = [types.prototype.type];

    // If array of typed section constructors is passed, transform the array to
    // type strings
  } else if (Array.isArray(types) && types[0].constructor === Section) {
    types = types.map(function (Section) {
      return Section.type;
    });
  }

  types = types.map(function (type) {
    return type.toLowerCase();
  });

  return types;
}

function normalizeContainers(containers) {
  // Nodelist with entries
  if (NodeList.prototype.isPrototypeOf(containers) && containers.length > 0) {
    containers = Array.prototype.slice.call(containers);

    // Empty Nodelist
  } else if (NodeList.prototype.isPrototypeOf(containers) && containers.length === 0) {
    containers = [];

    // Handle null (document.querySelector() returns null with no match)
  } else if (containers === null) {
    containers = [];

    // Single DOM element
  } else if (!Array.isArray(containers) && containers instanceof Element) {
    containers = [containers];
  }

  return containers;
}

if (window.Shopify.designMode) {
  document.addEventListener('shopify:section:load', function (event) {
    var id = event.detail.sectionId;
    var container = event.target.querySelector('[' + selectors.id + '="' + id + '"]');

    if (container !== null) {
      load(container.getAttribute(selectors.type), container);
    }
  });

  document.addEventListener('shopify:section:reorder', function (event) {
    var id = event.detail.sectionId;
    var container = event.target.querySelector('[' + selectors.id + '="' + id + '"]');
    var instance = getInstances(container)[0];

    if (typeof instance === 'object') {
      reorder(container);
    }
  });

  document.addEventListener('shopify:section:unload', function (event) {
    var id = event.detail.sectionId;
    var container = event.target.querySelector('[' + selectors.id + '="' + id + '"]');
    var instance = getInstances(container)[0];

    if (typeof instance === 'object') {
      unload(container);
    }
  });

  document.addEventListener('shopify:section:select', function (event) {
    var instance = getInstanceById(event.detail.sectionId);

    if (typeof instance === 'object') {
      instance.onSelect(event);
    }
  });

  document.addEventListener('shopify:section:deselect', function (event) {
    var instance = getInstanceById(event.detail.sectionId);

    if (typeof instance === 'object') {
      instance.onDeselect(event);
    }
  });

  document.addEventListener('shopify:block:select', function (event) {
    var instance = getInstanceById(event.detail.sectionId);

    if (typeof instance === 'object') {
      instance.onBlockSelect(event);
    }
  });

  document.addEventListener('shopify:block:deselect', function (event) {
    var instance = getInstanceById(event.detail.sectionId);

    if (typeof instance === 'object') {
      instance.onBlockDeselect(event);
    }
  });
}

export {registered, instances, register, unregister, load, unload, reorder, getInstances, getInstanceById, isInstance};
