// Run as the main script of a Figma development plugin.
figma.showUI(
  `<!doctype html><html><body>
<p id="status">Reading local variables…</p><a id="download" hidden>Download variables.json</a>
<script>
onmessage = (event) => {
  const message = event.data.pluginMessage;
  if (message.error) { document.getElementById('status').textContent = message.error; return; }
  const link = document.getElementById('download');
  link.href = URL.createObjectURL(new Blob([JSON.stringify(message.snapshot, null, 2)], {type: 'application/json'}));
  link.download = 'variables.json'; link.hidden = false;
  document.getElementById('status').textContent = 'Export ready. The design was not modified.';
};
</script></body></html>`,
  { width: 380, height: 140 },
)

async function exportVariables() {
  const source = await figma.variables.getLocalVariableCollectionsAsync()
  const collections = source.map(
    ({ id, name, defaultModeId, modes, variableIds }) => ({
      id,
      name,
      defaultModeId,
      modes,
      variableIds,
    }),
  )
  const variables = []
  for (const collection of collections) {
    for (const id of collection.variableIds) {
      const variable = await figma.variables.getVariableByIdAsync(id)
      if (!variable)
        throw new Error(`Variable disappeared during export: ${id}`)
      variables.push({
        id: variable.id,
        name: variable.name,
        variableCollectionId: variable.variableCollectionId,
        resolvedType: variable.resolvedType,
        valuesByMode: variable.valuesByMode,
      })
    }
  }
  return { collections, variables }
}

exportVariables().then(
  (snapshot) => figma.ui.postMessage({ snapshot }),
  (error) => figma.ui.postMessage({ error: String(error.message || error) }),
)
