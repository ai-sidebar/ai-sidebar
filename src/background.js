const ext = globalThis.browser ?? globalThis.chrome;

if (ext.sidePanel) {
  ext.sidePanel
    .setPanelBehavior?.({ openPanelOnActionClick: true })
    .catch(() => {});

  ext.sidePanel.onClosed?.addListener(() => {
    ext.sidePanel.setOptions({ path: "src/sidebar.html" }).catch(() => {});
  });
}
