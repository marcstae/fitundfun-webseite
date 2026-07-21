migrate((app) => {
  console.log("[DEBUG] typeof app:", typeof app);
  console.log("[DEBUG] app own props:", Object.getOwnPropertyNames(app));
  console.log("[DEBUG] proto props:", Object.getOwnPropertyNames(Object.getPrototypeOf(app)));
  console.log("[DEBUG] app.constructor.name:", app.constructor.name);
  console.log("[DEBUG] 'dao' in app:", "dao" in app);
  console.log("[DEBUG] 'save' in app:", "save" in app);
  console.log("[DEBUG] 'findCollectionByNameOrId' in app:", "findCollectionByNameOrId" in app);
  try { console.log("[DEBUG] typeof dao:", typeof dao); } catch(e) { console.log("[DEBUG] dao global: not accessible"); }
  try { console.log("[DEBUG] typeof $app:", typeof $app); } catch(e) { console.log("[DEBUG] $app global: not accessible"); }
  try { console.log("[DEBUG] typeof Collection:", typeof Collection); } catch(e) { console.log("[DEBUG] Collection global: not accessible"); }
  console.log("[DEBUG] Global props:", Object.getOwnPropertyNames(globalThis).slice(0, 30));
}, (app) => {});
