migrate((app) => {
  console.log("[DEBUG] migration starting");
  let collection = new Collection({
    name: "test",
    type: "base",
    fields: [
      { name: "title", type: "text" },
    ],
  });
  console.log("[DEBUG] collection created, about to save");
  app.save(collection);
  console.log("[DEBUG] collection saved successfully");
}, (app) => {});
