var styles = {};
styles.basic = [];

styles.light = [
  {featureType: 'administrative', elementType: 'labels', stylers: [{visibility: 'simplified'}, {lightness: '64'}, {hue: '#ff0000'}]},
  {featureType: 'administrative', elementType: 'labels.text.fill', stylers: [{color: '#bdbdbd'}]},
  {featureType: 'administrative', elementType: 'labels.icon', stylers: [{visibility: 'off'}]},
  {featureType: 'landscape', elementType: 'all', stylers: [{color: '#f0f0f0'}, {visibility: 'simplified'}]},
  {featureType: 'landscape.natural.landcover', elementType: 'all', stylers: [{visibility: 'off'}]},
  {featureType: 'landscape.natural.terrain', elementType: 'all', stylers: [{visibility: 'off'}]},
  {featureType: 'poi', elementType: 'all', stylers: [{visibility: 'off'}]},
  {featureType: 'poi', elementType: 'geometry.fill', stylers: [{visibility: 'off'}]},
  {featureType: 'poi', elementType: 'labels', stylers: [{lightness: '100'}]},
  {featureType: 'poi.park', elementType: 'all', stylers: [{visibility: 'on'}]},
  {featureType: 'poi.park', elementType: 'geometry', stylers: [{saturation: '-41'}, {color: '#e8ede7'}]},
  {featureType: 'poi.park', elementType: 'labels', stylers: [{visibility: 'off'}]},
  {featureType: 'road', elementType: 'all', stylers: [{saturation: '-100'}]},
  {featureType: 'road', elementType: 'labels', stylers: [{lightness: '25'}, {gamma: '1.06'}, {saturation: '-100'}]},
  {featureType: 'road.highway', elementType: 'all', stylers: [{visibility: 'simplified'}]},
  {featureType: 'road.highway', elementType: 'geometry.fill', stylers: [{gamma: '10.00'}]},
  {featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{weight: '0.01'}, {visibility: 'simplified'}]},
  {featureType: 'road.highway', elementType: 'labels', stylers: [{visibility: 'off'}]},
  {featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{weight: '0.01'}]},
  {featureType: 'road.highway', elementType: 'labels.text.stroke', stylers: [{weight: '0.01'}]},
  {featureType: 'road.arterial', elementType: 'geometry.fill', stylers: [{weight: '0.8'}]},
  {featureType: 'road.arterial', elementType: 'geometry.stroke', stylers: [{weight: '0.01'}]},
  {featureType: 'road.arterial', elementType: 'labels.icon', stylers: [{visibility: 'off'}]},
  {featureType: 'road.local', elementType: 'geometry.fill', stylers: [{weight: '0.01'}]},
  {featureType: 'road.local', elementType: 'geometry.stroke', stylers: [{gamma: '10.00'}, {lightness: '100'}, {weight: '0.4'}]},
  {featureType: 'road.local', elementType: 'labels', stylers: [{visibility: 'simplified'}, {weight: '0.01'}, {lightness: '39'}]},
  {featureType: 'road.local', elementType: 'labels.text.stroke', stylers: [{weight: '0.50'}, {gamma: '10.00'}, {lightness: '100'}]},
  {featureType: 'transit', elementType: 'all', stylers: [{visibility: 'off'}]},
  {featureType: 'water', elementType: 'all', stylers: [{color: '#cfe5ee'}, {visibility: 'on'}]},
];

styles.white_label = [
  {featureType: 'all', elementType: 'all', stylers: [{visibility: 'simplified'}]},
  {featureType: 'all', elementType: 'labels', stylers: [{visibility: 'simplified'}]},
  {featureType: 'administrative', elementType: 'labels', stylers: [{gamma: '3.86'}, {lightness: '100'}]},
  {featureType: 'administrative', elementType: 'labels.text.fill', stylers: [{color: '#cccccc'}]},
  {featureType: 'landscape', elementType: 'all', stylers: [{color: '#f2f2f2'}]},
  {featureType: 'poi', elementType: 'all', stylers: [{visibility: 'off'}]},
  {featureType: 'road', elementType: 'all', stylers: [{saturation: -100}, {lightness: 45}]},
  {featureType: 'road.highway', elementType: 'all', stylers: [{visibility: 'simplified'}]},
  {featureType: 'road.highway', elementType: 'geometry.fill', stylers: [{weight: '0.8'}]},
  {featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{weight: '0.8'}]},
  {featureType: 'road.highway', elementType: 'labels', stylers: [{visibility: 'off'}]},
  {featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{weight: '0.8'}]},
  {featureType: 'road.highway', elementType: 'labels.text.stroke', stylers: [{weight: '0.01'}]},
  {featureType: 'road.arterial', elementType: 'geometry.stroke', stylers: [{weight: '0'}]},
  {featureType: 'road.arterial', elementType: 'labels.icon', stylers: [{visibility: 'off'}]},
  {featureType: 'road.local', elementType: 'geometry.stroke', stylers: [{weight: '0.01'}]},
  {featureType: 'road.local', elementType: 'labels.text', stylers: [{visibility: 'off'}]},
  {featureType: 'transit', elementType: 'all', stylers: [{visibility: 'off'}]},
  {featureType: 'water', elementType: 'all', stylers: [{color: '#e4e4e4'}, {visibility: 'on'}]},
];

styles.dark_label = [
  {featureType: 'all', elementType: 'labels', stylers: [{visibility: 'off'}]},
  {featureType: 'all', elementType: 'labels.text.fill', stylers: [{saturation: 36}, {color: '#000000'}, {lightness: 40}]},
  {featureType: 'all', elementType: 'labels.text.stroke', stylers: [{visibility: 'on'}, {color: '#000000'}, {lightness: 16}]},
  {featureType: 'all', elementType: 'labels.icon', stylers: [{visibility: 'off'}]},
  {featureType: 'administrative', elementType: 'geometry.fill', stylers: [{color: '#000000'}, {lightness: 20}]},
  {featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{color: '#000000'}, {lightness: 17}, {weight: 1.2}]},
  {featureType: 'administrative', elementType: 'labels', stylers: [{visibility: 'simplified'}, {lightness: '-82'}]},
  {featureType: 'administrative', elementType: 'labels.text.stroke', stylers: [{invert_lightness: true}, {weight: '7.15'}]},
  {featureType: 'landscape', elementType: 'geometry', stylers: [{color: '#000000'}, {lightness: 20}]},
  {featureType: 'landscape', elementType: 'labels', stylers: [{visibility: 'off'}]},
  {featureType: 'poi', elementType: 'all', stylers: [{visibility: 'off'}]},
  {featureType: 'poi', elementType: 'geometry', stylers: [{color: '#000000'}, {lightness: 21}]},
  {featureType: 'road', elementType: 'labels', stylers: [{visibility: 'simplified'}]},
  {featureType: 'road.highway', elementType: 'geometry.fill', stylers: [{color: '#000000'}, {lightness: 17}, {weight: '0.8'}]},
  {featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{color: '#000000'}, {lightness: 29}, {weight: '0.01'}]},
  {featureType: 'road.highway', elementType: 'labels', stylers: [{visibility: 'off'}]},
  {featureType: 'road.arterial', elementType: 'geometry', stylers: [{color: '#000000'}, {lightness: 18}]},
  {featureType: 'road.arterial', elementType: 'geometry.stroke', stylers: [{weight: '0.01'}]},
  {featureType: 'road.local', elementType: 'geometry', stylers: [{color: '#000000'}, {lightness: 16}]},
  {featureType: 'road.local', elementType: 'geometry.stroke', stylers: [{weight: '0.01'}]},
  {featureType: 'road.local', elementType: 'labels', stylers: [{visibility: 'off'}]},
  {featureType: 'transit', elementType: 'all', stylers: [{visibility: 'off'}]},
  {featureType: 'transit', elementType: 'geometry', stylers: [{color: '#000000'}, {lightness: 19}]},
  {featureType: 'water', elementType: 'geometry', stylers: [{color: '#000000'}, {lightness: 17}]},
];

export function mapStyle(key) {
  return styles[key];
}
