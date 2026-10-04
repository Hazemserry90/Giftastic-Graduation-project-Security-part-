-- Diagnostic Queries for Commission System Issues

-- 1. Check if orders exist and their status
SELECT 
    id, 
    status, 
    commission_paid,
    total_amount,
    placed_at
FROM orders 
ORDER BY placed_at DESC 
LIMIT 10;

-- 2. Check if order_items have supplier_id
SELECT 
    o.id as order_id,
    o.status,
    oi.product_id,
    oi.supplier_id,
    oi.product_name,
    oi.quantity,
    oi.price
FROM orders o
JOIN order_items oi ON o.id = oi.order_id
ORDER BY o.placed_at DESC
LIMIT 20;

-- 3. Check if any commissions were created
SELECT 
    c.id,
    c.order_id,
    c.supplier_id,
    c.commission_amount,
    c.status,
    c.created_at,
    o.status as order_status
FROM commissions c
LEFT JOIN orders o ON c.order_id = o.id
ORDER BY c.created_at DESC
LIMIT 10;

-- 4. Check if products have supplier_id
SELECT 
    id,
    name,
    supplier_id,
    status
FROM products
WHERE supplier_id IS NULL
LIMIT 10;

-- 5. Find orders that are PAID but have no commissions
SELECT 
    o.id as order_id,
    o.status,
    o.total_amount,
    o.placed_at,
    COUNT(c.id) as commission_count
FROM orders o
LEFT JOIN commissions c ON o.id = c.order_id
WHERE o.status = 'PAID'
GROUP BY o.id, o.status, o.total_amount, o.placed_at
HAVING COUNT(c.id) = 0
ORDER BY o.placed_at DESC;

-- 6. Check order_items for PAID orders without supplier_id
SELECT 
    o.id as order_id,
    o.status,
    oi.product_id,
    oi.supplier_id,
    oi.product_name
FROM orders o
JOIN order_items oi ON o.id = oi.order_id
WHERE o.status = 'PAID' 
  AND oi.supplier_id IS NULL
ORDER BY o.placed_at DESC;

-- 7. Check commission rules
SELECT * FROM commission_rules WHERE active = true;

-- 8. Check if vendors exist
SELECT 
    v.id,
    v.supplier_id,
    v.store_name,
    v.is_verified
FROM vendors v
LIMIT 10;
