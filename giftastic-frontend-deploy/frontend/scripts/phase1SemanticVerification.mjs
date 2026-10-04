import { createServer } from 'vite';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
try {
  const { SEMANTIC_VIEW_REGISTRY } = await server.ssrLoadModule('/src/ui/entities/semanticViewRegistry.jsx');
  const { createEntityModel, markEntityFieldInvalid, setEntityValue } = await server.ssrLoadModule('/src/ui/entities/shared/entityModel.js');
  const results = [];
  for (const [entityType, views] of Object.entries(SEMANTIC_VIEW_REGISTRY)) {
    const field = entityType === 'favorite' ? 'productId' : views.sections[0].fields[0].path;
    const model = createEntityModel(entityType, ['id', 'name', field], 'semantic-verification', { complete: true });
    setEntityValue(model, 'id', `${entityType}-fixture`);
    setEntityValue(model, 'name', 'Visible fixture');
    setEntityValue(model, field, 'Visible fixture');
    model.meta.isPartial = false;
    const access = {
      canRead: true,
      permissionSet: new Set(['SUPER_ADMIN']),
      ownership: { isOwner: true },
      participation: {},
      fields: {},
      sections: new Proxy({}, { get: () => true }),
    };
    const summary = renderToStaticMarkup(React.createElement(views.Summary, { entity: model, access }));
    const card = renderToStaticMarkup(React.createElement(views.Card, { entity: model, access }));
    const row = renderToStaticMarkup(React.createElement(views.Row, { entity: model, access }));
    const details = renderToStaticMarkup(React.createElement(views.Details, { entity: model, access }));
    const workflow = renderToStaticMarkup(React.createElement(views.Workflow, {
      entity: model, access, handlers: new Proxy({}, { get: () => () => {} }),
    }));
    const partial = { ...model, meta: { ...model.meta, isPartial: true } };
    const partialMarkup = renderToStaticMarkup(React.createElement(views.Details, { entity: partial, access }));
    const forbiddenMarkup = renderToStaticMarkup(React.createElement(views.Details, { entity: model, access: { canRead: false, fields: {}, sections: {} } }));
    const loadingMarkup = renderToStaticMarkup(React.createElement(views.Details, { entity: model, access, state: 'loading' }));
    const emptyMarkup = renderToStaticMarkup(React.createElement(views.Details, { entity: null, access, state: 'empty' }));
    const errorMarkup = renderToStaticMarkup(React.createElement(views.Details, { entity: model, access, state: 'recoverable-error' }));
    markEntityFieldInvalid(model, field, {}, 'Invalid verification fixture');
    const invalidMarkup = renderToStaticMarkup(React.createElement(views.Details, { entity: model, access }));
    if (!summary.includes('data-entity-summary')) throw new Error(`${entityType} summary did not render`);
    if (!card.includes('data-entity-summary')) throw new Error(`${entityType} card did not render`);
    if (!row.includes('data-entity-summary')) throw new Error(`${entityType} row did not render`);
    if (entityType === 'favorite') {
      if (!details.includes('data-entity-summary="favorite"')) throw new Error('favorite decoration did not render');
      if (!workflow.includes('data-entity-summary="favorite"')) throw new Error('favorite remove workflow did not render');
    } else {
      if (!details.includes(`data-entity-type="${entityType}"`)) throw new Error(`${entityType} details did not render`);
      if (!workflow.includes(`data-entity-type="${entityType}"`)) throw new Error(`${entityType} workflow did not render`);
      if (!partialMarkup.includes('Partial data')) throw new Error(`${entityType} partial state did not render`);
      if (forbiddenMarkup.includes('Visible fixture')) throw new Error(`${entityType} leaked a forbidden value`);
      if (!forbiddenMarkup.includes('not available')) throw new Error(`${entityType} forbidden state missing`);
      if (!loadingMarkup.includes('Loading entity')) throw new Error(`${entityType} loading state missing`);
      if (!emptyMarkup.includes('No entity data')) throw new Error(`${entityType} empty state missing`);
      if (!errorMarkup.includes('Existing data is preserved')) throw new Error(`${entityType} recoverable error state missing`);
      if (!invalidMarkup.includes('Data unavailable')) throw new Error(`${entityType} invalid state missing`);
    }
    results.push(entityType);
  }

  const { adaptOrder } = await server.ssrLoadModule('/src/ui/entities/order/orderAdapters.js');
  const { buildOrderAccess, ORDER_CONTEXT } = await server.ssrLoadModule('/src/ui/entities/order/orderAccess.js');
  const { createViewer } = await server.ssrLoadModule('/src/ui/entities/shared/viewer.js');
  const order = adaptOrder({
    id: 'order-security-fixture', customerId: 'customer-fixture', status: 'PAID', totalAmount: '30.00',
    items: [
      { productId: 'visible-product', productName: 'Visible vendor item', supplierId: 'vendor-one', quantity: 1, price: '10.00' },
      { productId: 'hidden-product', productName: 'Other vendor secret', supplierId: 'vendor-two', quantity: 1, price: '20.00' },
    ],
  });
  const vendorAccess = buildOrderAccess({
    order,
    viewer: createViewer({ id: 'vendor-user', supplierId: 'vendor-one', roles: ['ROLE_USER', 'ROLE_VENDOR'] }),
    context: ORDER_CONTEXT.VENDOR,
  });
  const vendorOrderMarkup = renderToStaticMarkup(React.createElement(
    SEMANTIC_VIEW_REGISTRY.order.Details,
    { entity: order, access: vendorAccess },
  ));
  if (!vendorOrderMarkup.includes('Visible vendor item')) throw new Error('participating vendor item was not rendered');
  if (vendorOrderMarkup.includes('Other vendor secret')) throw new Error('order view leaked another vendor item');
  if (vendorOrderMarkup.includes('customer-fixture')) throw new Error('order view leaked the customer system identifier');

  const { adaptNotification } = await server.ssrLoadModule('/src/ui/entities/notification/notificationAdapters.js');
  const { buildNotificationAccess } = await server.ssrLoadModule('/src/ui/entities/notification/notificationAccess.js');
  const notification = adaptNotification({
    id: 'notification-system-id', userId: 'notification-owner-id', title: 'Owner-visible title', read: false,
  });
  const notificationAccess = buildNotificationAccess({
    notification,
    viewer: createViewer({ id: 'notification-owner-id', roles: ['ROLE_USER'] }),
  });
  const notificationMarkup = renderToStaticMarkup(React.createElement(
    SEMANTIC_VIEW_REGISTRY.notification.Details,
    { entity: notification, access: notificationAccess },
  ));
  if (!notificationMarkup.includes('Owner-visible title')) throw new Error('notification owner content was not rendered');
  if (notificationMarkup.includes('notification-system-id')) throw new Error('notification view leaked its system identifier');
  if (results.length !== 23) throw new Error(`Expected 23 semantic domains, found ${results.length}`);
  process.stdout.write(`semantic domains verified: ${results.length}\n`);
} finally {
  await server.close();
}
