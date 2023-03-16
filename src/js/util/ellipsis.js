const tokensReducer = (acc, token) => {
  const {el, elStyle, elHeight, rowsLimit, rowsWrapped, options} = acc;
  let oldBuffer = acc.buffer;
  let newBuffer = oldBuffer;

  if (rowsWrapped === rowsLimit + 1) {
    return {...acc};
  }
  const textBeforeWrap = oldBuffer;
  let newRowsWrapped = rowsWrapped;
  let newHeight = elHeight;
  el.innerHTML = newBuffer = oldBuffer.length ? `${oldBuffer}${options.delimiter}${token}${options.replaceStr}` : `${token}${options.replaceStr}`;

  if (parseFloat(elStyle.height) > parseFloat(elHeight)) {
    newRowsWrapped++;
    newHeight = elStyle.height;

    if (newRowsWrapped === rowsLimit + 1) {
      el.innerHTML = newBuffer = textBeforeWrap[textBeforeWrap.length - 1] === '.' && options.replaceStr === '...' ? `${textBeforeWrap}..` : `${textBeforeWrap}${options.replaceStr}`;

      return {...acc, elHeight: newHeight, rowsWrapped: newRowsWrapped};
    }
  }

  el.innerHTML = newBuffer = textBeforeWrap.length ? `${textBeforeWrap}${options.delimiter}${token}` : `${token}`;

  return {...acc, buffer: newBuffer, elHeight: newHeight, rowsWrapped: newRowsWrapped};
};

const ellipsis = (selector = '', rows = 1, options = {}) => {
  const defaultOptions = {
    replaceStr: '...',
    debounceDelay: 250,
    delimiter: ' ',
  };

  const opts = {...defaultOptions, ...options};

  const elements =
    selector &&
    (selector instanceof NodeList
      ? selector
      : selector.nodeType === 1 // if node type is Node.ELEMENT_NODE
      ? [selector] // wrap it in (NodeList) if it is a single node
      : document.querySelectorAll(selector));

  for (let i = 0; i < elements.length; i++) {
    const el = elements[i];
    const elementHtml = el.innerHTML;
    const commentRegex = /<!--[\s\S]*?-->/g;
    const htmlWithoutComments = elementHtml.replace(commentRegex, '');
    const splittedText = htmlWithoutComments.split(opts.delimiter);

    el.innerHTML = '';
    const elStyle = window.getComputedStyle(el);

    splittedText.reduce(tokensReducer, {
      el,
      buffer: el.innerHTML,
      elStyle,
      elHeight: 0,
      rowsLimit: rows,
      rowsWrapped: 0,
      options: opts,
    });
  }
};

export {ellipsis};
