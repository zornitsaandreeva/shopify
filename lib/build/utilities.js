module.exports.processSvg = ($, file) => {
  var $svg = $('svg');
  var $newSvg = $('<svg aria-hidden="true" focusable="false" role="presentation" class="icon" />');
  var fileName = file.relative.replace('.svg', '');
  var viewBoxAttr = $svg.attr('viewbox');

  // Add necessary attributes
  if (viewBoxAttr) {
    var width = parseInt(viewBoxAttr.split(' ')[2], 10);
    var height = parseInt(viewBoxAttr.split(' ')[3], 10);
    var widthToHeightRatio = width / height;
    if (widthToHeightRatio >= 1.5) {
      $newSvg.addClass('icon--wide');
    }
    $newSvg.attr('viewBox', viewBoxAttr);
  }

  // Add required classes to full color icons
  if (file.relative.indexOf('-full-color') >= 0) {
    $newSvg.addClass('icon--full-color');
  }

  $newSvg.addClass(fileName).append($svg.contents());

  $newSvg.append($svg.contents());
  $svg.after($newSvg);
  $svg.remove();
};
