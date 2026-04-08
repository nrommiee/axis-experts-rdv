/**
 * Diagnostic script: test x_studio_partie_1_bailleurs_ field behavior in Odoo
 *
 * Usage:
 *   ODOO_URL=https://xxx.odoo.com ODOO_DB=xxx ODOO_USER=xxx ODOO_API_KEY=xxx node debug-bailleur.mjs
 *
 * Or with .env.local loaded:
 *   node -e "require('fs').readFileSync('.env.local','utf8').split('\\n').forEach(l=>{const[k,...v]=l.split('=');if(k&&!k.startsWith('#'))process.env[k.trim()]=v.join('=').trim()});import('./debug-bailleur.mjs')"
 */

import xmlrpc from "xmlrpc";

const url = process.env.ODOO_URL;
const db = process.env.ODOO_DB;
const user = process.env.ODOO_USER;
const apiKey = process.env.ODOO_API_KEY;

if (!url || !db || !user || !apiKey) {
  console.error("Missing env vars. Set ODOO_URL, ODOO_DB, ODOO_USER, ODOO_API_KEY");
  process.exit(1);
}

function createSecureClient(path) {
  const parsed = new URL(url);
  return xmlrpc.createSecureClient({ host: parsed.hostname, port: 443, path });
}

function call(client, method, params) {
  return new Promise((resolve, reject) => {
    client.methodCall(method, params, (err, value) => {
      if (err) reject(err);
      else resolve(value);
    });
  });
}

async function authenticate() {
  const common = createSecureClient("/xmlrpc/2/common");
  const uid = await call(common, "authenticate", [db, user, apiKey, {}]);
  console.log(`[AUTH] uid = ${uid}`);
  return uid;
}

async function execute(uid, model, method, args, kwargs = {}) {
  const object = createSecureClient("/xmlrpc/2/object");
  return call(object, "execute_kw", [db, uid, apiKey, model, method, args, kwargs]);
}

// ─── Main ───────────────────────────────────────────────────────────

async function main() {
  console.log("═══════════════════════════════════════════════════════");
  console.log("  DIAGNOSTIC: x_studio_partie_1_bailleurs_");
  console.log("═══════════════════════════════════════════════════════\n");

  // Step A: Authenticate
  const uid = await authenticate();

  // Step B: fields_get — exact field metadata
  console.log("\n── Step B: fields_get on sale.order ──");
  const targetFields = [
    "x_studio_partie_1_bailleurs_",
    "x_studio_partie_2_locataires_",
    "x_studio_conseil_intervenant_2_",
  ];
  const fieldsMeta = await execute(uid, "sale.order", "fields_get", [targetFields], {
    attributes: ["type", "relation", "readonly", "required", "string", "domain", "store"],
  });
  for (const fname of targetFields) {
    if (fieldsMeta[fname]) {
      console.log(`\n  ${fname}:`);
      console.log(`    type     = ${fieldsMeta[fname].type}`);
      console.log(`    relation = ${fieldsMeta[fname].relation}`);
      console.log(`    string   = ${fieldsMeta[fname].string}`);
      console.log(`    readonly = ${fieldsMeta[fname].readonly}`);
      console.log(`    required = ${fieldsMeta[fname].required}`);
      console.log(`    store    = ${fieldsMeta[fname].store}`);
      console.log(`    domain   = ${JSON.stringify(fieldsMeta[fname].domain)}`);
      console.log(`    RAW      = ${JSON.stringify(fieldsMeta[fname])}`);
    } else {
      console.log(`\n  ${fname}: *** FIELD NOT FOUND ***`);
    }
  }

  // Step C: Find the most recent sale.order with the problem
  console.log("\n\n── Step C: Read most recent sale.order ──");
  const recentOrders = await execute(uid, "sale.order", "search_read", [
    [["x_studio_partie_1_bailleurs_", "!=", false]],
  ], {
    fields: ["id", "name", "partner_id", "x_studio_partie_1_bailleurs_", "x_studio_partie_2_locataires_"],
    order: "id desc",
    limit: 3,
  });

  if (recentOrders.length === 0) {
    console.log("  No orders found with x_studio_partie_1_bailleurs_ set.");
    // Try without filter
    const anyOrders = await execute(uid, "sale.order", "search_read", [[]], {
      fields: ["id", "name", "partner_id", "x_studio_partie_1_bailleurs_", "x_studio_partie_2_locataires_"],
      order: "id desc",
      limit: 3,
    });
    console.log("  Most recent 3 orders (unfiltered):");
    for (const o of anyOrders) {
      console.log(`    id=${o.id} name=${o.name} partner_id=${JSON.stringify(o.partner_id)} bailleur=${JSON.stringify(o.x_studio_partie_1_bailleurs_)} locataire=${JSON.stringify(o.x_studio_partie_2_locataires_)}`);
    }
    if (anyOrders.length === 0) {
      console.log("  No orders at all. Cannot test write.");
      return;
    }
  } else {
    console.log("  Orders with bailleur field set:");
    for (const o of recentOrders) {
      console.log(`    id=${o.id} name=${o.name} partner_id=${JSON.stringify(o.partner_id)} bailleur=${JSON.stringify(o.x_studio_partie_1_bailleurs_)} locataire=${JSON.stringify(o.x_studio_partie_2_locataires_)}`);
    }
  }

  // Pick a test order
  const allOrders = recentOrders.length > 0 ? recentOrders : await execute(uid, "sale.order", "search_read", [[]], {
    fields: ["id", "name", "partner_id"],
    order: "id desc",
    limit: 1,
  });
  const testOrder = allOrders[0];
  const testOrderId = testOrder.id;
  const testPartnerId = Array.isArray(testOrder.partner_id) ? testOrder.partner_id[0] : testOrder.partner_id;
  console.log(`\n  Test order: id=${testOrderId} name=${testOrder.name} partner_id=${testPartnerId}`);

  // Step D: Read the raw current value of the bailleur field
  console.log("\n\n── Step D: Read current bailleur field value (raw) ──");
  const currentRead = await execute(uid, "sale.order", "read", [[testOrderId]], {
    fields: ["x_studio_partie_1_bailleurs_", "x_studio_partie_2_locataires_"],
  });
  console.log(`  Raw read result: ${JSON.stringify(currentRead, null, 2)}`);

  // Step E: Attempt write with [[6, 0, [partnerId]]]
  console.log("\n\n── Step E: Write with [[6, 0, [partnerId]]] ──");
  const fieldType = fieldsMeta["x_studio_partie_1_bailleurs_"]?.type;
  try {
    if (fieldType === "many2many") {
      const writeVal = [[6, 0, [testPartnerId]]];
      console.log(`  Writing x_studio_partie_1_bailleurs_ = ${JSON.stringify(writeVal)}`);
      const writeResult = await execute(uid, "sale.order", "write", [[testOrderId], {
        x_studio_partie_1_bailleurs_: writeVal,
      }]);
      console.log(`  Write result: ${JSON.stringify(writeResult)}`);
    } else if (fieldType === "many2one") {
      console.log(`  Field is many2one — writing plain integer: ${testPartnerId}`);
      const writeResult = await execute(uid, "sale.order", "write", [[testOrderId], {
        x_studio_partie_1_bailleurs_: testPartnerId,
      }]);
      console.log(`  Write result: ${JSON.stringify(writeResult)}`);
    } else {
      console.log(`  Unknown field type "${fieldType}" — trying [[6, 0, [id]]] anyway`);
      const writeResult = await execute(uid, "sale.order", "write", [[testOrderId], {
        x_studio_partie_1_bailleurs_: [[6, 0, [testPartnerId]]],
      }]);
      console.log(`  Write result: ${JSON.stringify(writeResult)}`);
    }
  } catch (err) {
    console.error(`  Write FAILED: ${err.message}`);
    console.error(`  Full error: ${JSON.stringify(err)}`);
  }

  // Step E2: Re-read after write
  console.log("\n── Step E2: Re-read after write ──");
  const afterWrite = await execute(uid, "sale.order", "read", [[testOrderId]], {
    fields: ["x_studio_partie_1_bailleurs_"],
  });
  console.log(`  After write: ${JSON.stringify(afterWrite, null, 2)}`);

  // Step F: If [[6,0,[id]]] didn't work, try [[4, partnerId]]
  const afterVal = afterWrite[0]?.x_studio_partie_1_bailleurs_;
  const isEmpty = !afterVal || (Array.isArray(afterVal) && afterVal.length === 0);
  if (isEmpty) {
    console.log("\n── Step F: Value empty after [[6,0,[id]]], trying [[4, partnerId]] ──");
    try {
      const writeResult2 = await execute(uid, "sale.order", "write", [[testOrderId], {
        x_studio_partie_1_bailleurs_: [[4, testPartnerId]],
      }]);
      console.log(`  Write result: ${JSON.stringify(writeResult2)}`);
      const afterWrite2 = await execute(uid, "sale.order", "read", [[testOrderId]], {
        fields: ["x_studio_partie_1_bailleurs_"],
      });
      console.log(`  After [[4, id]] write: ${JSON.stringify(afterWrite2, null, 2)}`);
    } catch (err) {
      console.error(`  [[4, id]] write FAILED: ${err.message}`);
    }
  } else {
    console.log("\n── Step F: Skipped — value is set after [[6,0,[id]]] ──");
  }

  // Step G: Check if there are any onchange or compute constraints
  console.log("\n\n── Step G: Extended field attributes ──");
  const extMeta = await execute(uid, "sale.order", "fields_get", [targetFields], {
    attributes: ["type", "relation", "readonly", "required", "string", "store", "depends", "compute", "related", "company_dependent"],
  });
  for (const fname of targetFields) {
    if (extMeta[fname]) {
      console.log(`\n  ${fname} (extended):`);
      console.log(`    ${JSON.stringify(extMeta[fname], null, 4)}`);
    }
  }

  console.log("\n═══════════════════════════════════════════════════════");
  console.log("  DIAGNOSTIC COMPLETE");
  console.log("═══════════════════════════════════════════════════════");
}

main().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});
