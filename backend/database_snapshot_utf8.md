# Coffee Shop POS Database Audit

**Database File**: `coffeshop.db`
**Total Tables**: 13 (users, products, inventory, sales, sale_items, customers, suppliers, raw_materials, purchase_orders, product_recipes, purchase_order_items, branches, stock_transfers)

### Table: users
| id | username | password_hash | role | is_active | branch_id |
| --- | --- | --- | --- | --- | --- |
| 1 | admin | $2b$12$Z887mMy2QZ3dubQyW5VhQug/TVvUmSsm5sM.R/x09pJOp9m0NO4lS | ADMIN | 1 | 1 |
| 2 | admin1 | $2b$12$W9vX6LNNRHWnSEdswJUVq.3GhmnyiRgM3n.bqyLSJxv1k74wFQEZm | ADMIN | 1 | 1 |
| 3 | owner | $2b$12$IHsPb.cVtqiWJPoVUU9tmeCMXX2JLVO5BMyw6f4TjUizzXYcyAE8a | OWNER | 1 | 1 |
| 4 | manager1 | $2b$12$UjcqGYF4iFJcC3RXakJ8KORUHB4dpebzgEBWnEFr4RlkceH7ytME. | MANAGER | 1 | 1 |


### Table: products
| id | name | description | price | category | branch_id |
| --- | --- | --- | --- | --- | --- |


### Table: inventory
| id | product_id | quantity | reorder_level | branch_id |
| --- | --- | --- | --- | --- |


### Table: sales
| id | user_id | total_amount | created_at | customer_id | branch_id |
| --- | --- | --- | --- | --- | --- |
| 1 | 1 | 250.0 | 2026-02-16 16:34:31 | None | 1 |
| 2 | 1 | 250.0 | 2026-02-16 16:34:33 | None | 1 |
| 3 | 1 | 25.0 | 2026-02-16 16:36:46 | None | 1 |
| 4 | 1 | 25.0 | 2026-02-16 16:50:25 | None | 1 |
| 5 | 1 | 25.0 | 2026-02-16 16:50:26 | None | 1 |


### Table: sale_items
| id | sale_id | product_id | quantity | price_at_sale |
| --- | --- | --- | --- | --- |


### Table: customers
| id | phone | name | created_at |
| --- | --- | --- | --- |
| 1 | 9092330688 | dishyanth | 2026-02-17 13:55:46 |


### Table: suppliers
| id | name | contact_name | email | phone | address |
| --- | --- | --- | --- | --- | --- |
| 1 | enterprises | dishyanth | dishyanthsaravanan@gmail.com | 9092330688 | 10/49 anna colony second  street besant nagr chennai 600090 |


### Table: raw_materials
| id | name | unit | stock | min_level | supplier_id | branch_id |
| --- | --- | --- | --- | --- | --- | --- |


### Table: purchase_orders
| id | supplier_id | status | total_amount | created_at | branch_id |
| --- | --- | --- | --- | --- | --- |
| 1 | 1 | RECEIVED | 0.0 | 2026-02-17 14:44:33 | 1 |


### Table: product_recipes
| id | product_id | raw_material_id | quantity |
| --- | --- | --- | --- |


### Table: purchase_order_items
| id | purchase_order_id | raw_material_id | quantity | unit_price |
| --- | --- | --- | --- | --- |


### Table: branches
| id | name | location | owner_id | is_active |
| --- | --- | --- | --- | --- |
| 1 | Main Branch | Central City | 3 | 0 |
| 2 | cc | cc | 1 | 0 |


### Table: stock_transfers
| id | from_branch_id | to_branch_id | raw_material_id | quantity | status | created_at | updated_at |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 1 | 1 | 1 | 10.0 | APPROVED | 2026-02-17 16:05:53 | 2026-02-17 16:06:02 |


