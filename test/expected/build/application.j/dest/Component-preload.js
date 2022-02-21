//@ui5-bundle application/j/Component-preload.js
jQuery.sap.registerPreloadedModules({
"version":"2.0",
"modules":{
	"application/j/Component.js":function(){sap.ui.define(["sap/ui/core/UIComponent"],function(n){"use strict";return n.extend("application.j.Component",{metadata:{manifest:"json"}})});
},
	"application/j/changes/coding/MyExtension.js":function(){sap.ui.define([],function(){return{}});
},
	"application/j/changes/flexibility-bundle.json":'{"changes":[{"fileName":"id_456_addField","fileType":"change","changeType":"hideControl","component":"application.j.Component","content":{},"selector":{"id":"control1"},"layer":"VENDOR","texts":{},"namespace":"apps/application.j.Component/changes","creation":"2023-10-30T13:52:40.4754350Z","originalLanguage":"","conditions":{},"support":{"generator":"did it","user":"SAP"}},{"fileName":"id_123_addField","fileType":"change","changeType":"hideControl","component":"application.j.Component","content":{},"selector":{"id":"control1"},"layer":"CUSTOMER","texts":{},"namespace":"apps/application.j.Component/changes","creation":"2025-10-30T13:52:40.4754350Z","originalLanguage":"","conditions":{},"support":{"generator":"did it","user":"Max Mustermann"}}],"compVariants":[{"fileName":"id_111_compVariants","fileType":"variant","changeType":"hideControl","component":"application.j.Component","content":{},"selector":{"id":"control1"},"layer":"VENDOR","texts":{},"namespace":"apps/application.j.Component/changes","creation":"2025-10-30T13:52:40.4754350Z","originalLanguage":"","conditions":{},"support":{"generator":"did it","user":"SAP"},"appDescriptorChange":false}],"variants":[{"fileName":"id_111_test","fileType":"ctrl_variant","changeType":"hideControl","component":"application.j.Component","content":{},"selector":{"id":"control1"},"layer":"VENDOR","texts":{},"namespace":"apps/application.j.Component/changes","creation":"2025-10-30T13:52:40.4754350Z","originalLanguage":"","conditions":{},"support":{"generator":"did it","user":"SAP"}}],"variantChanges":[{"fileName":"id_111_test","fileType":"ctrl_variant_change","changeType":"hideControl","component":"application.j.Component","content":{},"selector":{"id":"control1"},"layer":"VENDOR","texts":{},"namespace":"apps/application.j.Component/changes","creation":"2025-10-30T13:52:40.4754350Z","originalLanguage":"","conditions":{},"support":{"generator":"did it","user":"SAP"}}],"variantDependentControlChanges":[{"fileName":"id_111_variantDependentControlChange","fileType":"change","changeType":"hideControl","component":"application.j.Component","content":{},"selector":{"id":"control1"},"layer":"VENDOR","texts":{},"namespace":"apps/application.j.Component/changes","creation":"2025-10-30T13:52:40.4754350Z","originalLanguage":"","conditions":{},"support":{"generator":"did it","user":"SAP"},"variantReference":"someting here"}],"variantManagementChanges":[{"fileName":"id_111_test","fileType":"ctrl_variant_management_change","changeType":"hideControl","component":"application.j.Component","content":{},"selector":{"id":"control1"},"layer":"VENDOR","texts":{},"namespace":"apps/application.j.Component/changes","creation":"2025-10-30T13:52:40.4754350Z","originalLanguage":"","conditions":{},"support":{"generator":"did it","user":"SAP"}}]}',
	"application/j/changes/fragments/MyFragment.fragment.xml":'<xml></xml>',
	"application/j/manifest.json":'{"_version":"1.1.0","sap.app":{"_version":"1.1.0","id":"application.j","type":"application","applicationVersion":{"version":"1.2.2"},"embeds":["embedded"],"title":"{{title}}"},"sap.ui5":{"dependencies":{"minUI5Version":"1.100.2","libs":{"sap.ui.layout":{},"sap.ui.core":{},"sap.m":{},"sap.ui.fl":{"lazy":false}}}}}'
}});
