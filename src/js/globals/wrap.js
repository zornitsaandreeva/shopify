import wrap from '../util/wrap';

function wrapElements(container) {
  // Target tables to make them scrollable
  const tableSelectors = '.rte table';
  const tables = container.querySelectorAll(tableSelectors);
  tables.forEach((table) => {
    wrap(table, 'rte__table-wrapper');
  });

  // Target iframes to make them responsive
  const iframeSelectors = '.rte iframe[src*="youtube.com/embed"], .rte iframe[src*="player.vimeo"], .rte iframe#admin_bar_iframe';
  const frames = container.querySelectorAll(iframeSelectors);
  frames.forEach((frame) => {
    wrap(frame, 'rte__video-wrapper');
  });
}

export default wrapElements;
