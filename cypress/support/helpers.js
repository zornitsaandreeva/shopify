import Shopify from '@shopify/shopify-api';

require('dotenv').config();

const client = new Shopify.Clients.Rest(session.shop, session.accessToken);
const product = await client.get({
  path: `products/${productId}`,
  query: {id: 1, title: 'title'},
});

console.log({product});
