migrate((app) => {
  console.log("[DEBUG] app keys:", Object.getOwnPropertyNames(Object.getPrototypeOf(app)));
  try {
    console.log("[DEBUG] app.dao exists:", typeof app.dao);
  } catch(e) { console.log("[DEBUG] app.dao error:", e.message); }
  try {
    console.log("[DEBUG] app.save exists:", typeof app.save);
  } catch(e) { console.log("[DEBUG] app.save error:", e.message); }
  try {
    console.log("[DEBUG] app.saveCollection exists:", typeof app.saveCollection);
  } catch(e) { console.log("[DEBUG] app.saveCollection error:", e.message); }
}, (app) => {});
