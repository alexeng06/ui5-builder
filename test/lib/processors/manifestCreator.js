const test = require("ava");
const sinon = require("sinon");
const mock = require("mock-require");
const logger = require("@ui5/logger");
const {SemVer: Version} = require("semver");

const libraryContent = `<?xml version="1.0" encoding="UTF-8" ?>
<library xmlns="http://www.sap.com/sap.ui.library.xsd" >
	<name>library.e</name>
	<vendor>SAP SE</vendor>
	<copyright>my copyright</copyright>
	<version>1.0.0</version>
	<documentation>Library E</documentation>

	<dependencies>
	    <dependency>
	      <libraryName>sap.ui.core</libraryName>
	    </dependency>
	</dependencies>
	
	<appData>
		<manifest xmlns="http://www.sap.com/ui5/buildext/manifest">
			<i18n>i18n/i18n.properties</i18n>
		</manifest>
	</appData>
</library>`;

const libraryContentSpecialChars = `<?xml version="1.0" encoding="UTF-8" ?>
<library xmlns="http://www.sap.com/sap.ui.library.xsd" >
	<name>library.e</name>
	<vendor>SAP SE</vendor>
	<copyright>my copyright</copyright>
	<version>1.0.0</version>
	<documentation>Library E</documentation>

	<dependencies>
	    <dependency>
	      <libraryName>sap.ui.core</libraryName>
	    </dependency>
	</dependencies>
	
	<appData>
		<manifest xmlns="http://www.sap.com/ui5/buildext/manifest">
			<i18n>i18n(.*)./i18n(.*).properties</i18n>
		</manifest>
	</appData>
</library>`;

const expectedManifestContentObject = () => {
	return {
		"_version": "1.21.0",
		"sap.app": {
			"id": "library.e",
			"type": "library",
			"embeds": [],
			"i18n": {
				"bundleUrl": "i18n/i18n.properties",
				"supportedLocales": [
					"",
					"de",
					"en"
				]
			},
			"applicationVersion": {
				"version": "1.0.0"
			},
			"title": "Library E",
			"description": "Library E",
			"resources": "resources.json",
			"offline": true
		},
		"sap.ui": {
			"technology": "UI5",
			"supportedThemes": []
		},
		"sap.ui5": {
			"dependencies": {
				"libs": {
					"sap.ui.core": {}
				}
			},
			"library": {
				"i18n": false
			}
		}
	};
};

const expectedManifestContent = JSON.stringify(expectedManifestContentObject(), null, 2);
const expectedManifestContentSpecialCharsObject = expectedManifestContentObject();
expectedManifestContentSpecialCharsObject["sap.app"]["i18n"]["bundleUrl"] = "i18n(.*)./i18n(.*).properties";
const expectedManifestContentSpecialChars = JSON.stringify(expectedManifestContentSpecialCharsObject, null, 2);

test.beforeEach((t) => {
	t.context.verboseLogStub = sinon.stub();
	t.context.errorLogStub = sinon.stub();
	sinon.stub(logger, "getLogger").returns({
		verbose: t.context.verboseLogStub,
		error: t.context.errorLogStub
	});
	t.context.manifestCreator = mock.reRequire("../../../lib/processors/manifestCreator");
});

test.afterEach.always((t) => {
	mock.stopAll();
	sinon.restore();
});

test.serial("default manifest creation", async (t) => {
	const {manifestCreator, errorLogStub} = t.context;
	const prefix = "/resources/sap/ui/mine/";
	const libraryResource = {
		getPath: () => {
			return prefix + ".library";
		},
		getString: async () => {
			return libraryContent;
		},
		_project: {
			dependencies: [{
				metadata: {
					name: "sap.ui.core"
				}
			}]
		}
	};
	const resources = ["", "_en", "_de"].map((lang) => {
		return {
			getPath: () => {
				return `${prefix}i18n/i18n${lang}.properties`;
			}
		};
	});
	t.is(errorLogStub.callCount, 0);

	const result = await manifestCreator({libraryResource, resources, options: {}});
	t.is(await result.getString(), expectedManifestContent, "Correct result returned");
});

test.serial("default manifest creation i18n empty string", async (t) => {
	const {manifestCreator, errorLogStub} = t.context;
	const prefix = "/resources/sap/ui/mine/";
	const libraryResource = {
		getPath: () => {
			return prefix + ".library";
		},
		getString: async () => {
			return `<?xml version="1.0" encoding="UTF-8" ?>
				<library xmlns="http://www.sap.com/sap.ui.library.xsd" >
					<name>library.e</name>
					<vendor>SAP SE</vendor>
					<copyright>my copyright</copyright>
					<version>1.0.0</version>
					<documentation>Library E</documentation>
				
					<dependencies>
					    <dependency>
					      <libraryName>sap.ui.core</libraryName>
					    </dependency>
					</dependencies>
					
					<appData>
						<manifest xmlns="http://www.sap.com/ui5/buildext/manifest">
							<i18n></i18n>
						</manifest>
					</appData>
				</library>`;
		},
		_project: {
			dependencies: [{
				metadata: {
					name: "sap.ui.core"
				}
			}]
		}
	};

	t.is(errorLogStub.callCount, 0);
	const expectedManifestContentObjectModified = expectedManifestContentObject();
	expectedManifestContentObjectModified["sap.app"]["i18n"] = "";
	const expectedManifestContent = JSON.stringify(expectedManifestContentObjectModified, null, 2);
	const result = await manifestCreator({libraryResource, resources: [], options: {}});
	t.is(await result.getString(), expectedManifestContent, "Correct result returned");
});

test.serial("default manifest creation with invalid version", async (t) => {
	const {manifestCreator, errorLogStub} = t.context;
	const prefix = "/resources/sap/ui/mine/";
	const libraryResource = {
		getPath: () => {
			return prefix + ".library";
		},
		getString: async () => {
			return `<?xml version="1.0" encoding="UTF-8" ?>
				<library xmlns="http://www.sap.com/sap.ui.library.xsd" >
					<name>library.e</name>
					<vendor>SAP SE</vendor>
					<version>@version@</version>
					<documentation>Library E</documentation>
				
					<dependencies>
					    <dependency>
					      <libraryName>sap.ui.core</libraryName>
					    </dependency>
					</dependencies>

				</library>`;
		},
		_project: {
			dependencies: [{
				metadata: {
					name: "sap.ui.core"
				}
			}],
			version: "1.2.3"
		}
	};

	t.is(errorLogStub.callCount, 0);
	const expectedManifestContentObjectModified = expectedManifestContentObject();
	expectedManifestContentObjectModified["sap.app"]["i18n"] = undefined;
	expectedManifestContentObjectModified["sap.app"]["applicationVersion"]["version"] = "1.2.3";
	const expectedManifestContent = JSON.stringify(expectedManifestContentObjectModified, null, 2);
	const result = await manifestCreator({libraryResource, resources: [], options: {}});
	t.is(await result.getString(), expectedManifestContent, "Correct result returned");
});

test.serial("default manifest creation with sourceTemplate and thirdparty", async (t) => {
	const {manifestCreator, errorLogStub} = t.context;
	const prefix = "/resources/sap/ui/mine/";
	const libraryResource = {
		getPath: () => {
			return prefix + ".library";
		},
		getString: async () => {
			return `<?xml version="1.0" encoding="UTF-8" ?>
				<library xmlns="http://www.sap.com/sap.ui.library.xsd" >
					<name>library.e</name>
					<vendor>SAP SE</vendor>
					<version>@version@</version>
					<documentation>Library E</documentation>
				
					<dependencies>
					    <dependency>
					      <libraryName>sap.ui.core</libraryName>
					    </dependency>
					    <dependency>
					      <libraryName>my.lib</libraryName>
					      <version>4.5.6</version>
					    </dependency>
					</dependencies>
					
					<appData>
						<manifest xmlns="http://www.sap.com/ui5/buildext/manifest">
							<sourceTemplate>
								<id>myid</id>
								<version>1.2.3</version>
							</sourceTemplate>
						</manifest>
						<thirdparty xmlns="http://www.sap.com/ui5/buildext/thirdparty">
							<lib name="jquery-3" displayName="jQuery 3" version="3.5.1" homepage="https://jquery.com"></lib>
							<lib name="jquery-2" displayName="jQuery 2" version="2.2.3" homepage="https://jquery.com"></lib>
						</thirdparty>
					</appData>

				</library>`;
		},
		_project: {
			dependencies: [{
				metadata: {
					name: "sap.ui.core"
				}
			}, {
				metadata: {
					name: "my.lib"
				}
			}],
			version: "1.2.3"
		}
	};

	t.is(errorLogStub.callCount, 0);
	const expectedManifestContentObjectModified = expectedManifestContentObject();
	expectedManifestContentObjectModified["sap.app"]["i18n"] = undefined;
	expectedManifestContentObjectModified["sap.app"]["applicationVersion"]["version"] = "1.2.3";
	expectedManifestContentObjectModified["sap.app"]["sourceTemplate"]= {
		id: "myid",
		version: "1.2.3"
	};
	expectedManifestContentObjectModified["sap.app"]["openSourceComponents"]= [{
		"name": "jquery-3",
		"packagedWithMySelf": true,
		"version": "3.5.1"
	}, {
		"name": "jquery-2",
		"packagedWithMySelf": true,
		"version": "2.2.3"
	}];
	expectedManifestContentObjectModified["sap.ui5"]["dependencies"]["libs"]["my.lib"] = {
		"minVersion": "4.5.6"
	};
	const expectedManifestContent = JSON.stringify(expectedManifestContentObjectModified, null, 2);
	const result = await manifestCreator({libraryResource, resources: [], options: {}});
	t.is(await result.getString(), expectedManifestContent, "Correct result returned");
});

test.serial("default manifest creation no dependency version", async (t) => {
	const {manifestCreator, errorLogStub} = t.context;
	const prefix = "/resources/sap/ui/mine/";
	const libraryResource = {
		getPath: () => {
			return prefix + ".library";
		},
		getString: async () => {
			return `<?xml version="1.0" encoding="UTF-8" ?>
				<library xmlns="http://www.sap.com/sap.ui.library.xsd" >
					<name>library.e</name>
					<vendor>SAP SE</vendor>
					<documentation>Library E</documentation>
				
					<dependencies>
					    <dependency>
					      <libraryName>sap.ui.core</libraryName>
					    </dependency>
					    <dependency>
					      <libraryName>my.lib</libraryName>
					    </dependency>
					</dependencies>

				</library>`;
		},
		_project: {
			dependencies: [{
				metadata: {
					name: "sap.ui.core"
				}
			}]
		}
	};

	t.is(errorLogStub.callCount, 0);

	const error = await t.throwsAsync(manifestCreator({
		libraryResource,
		resources: []
	}));
	t.deepEqual(error.message,
		"Couldn't find version for library 'my.lib', project dependency missing?", "error message correct");
});

test.serial("default manifest creation with special characters", async (t) => {
	const {manifestCreator, errorLogStub} = t.context;
	const prefix = "/resources/sap/ui/mine/";
	const libraryResource = {
		getPath: () => {
			return prefix + ".library";
		},
		getString: async () => {
			return libraryContentSpecialChars;
		},
		_project: {
			dependencies: [{
				metadata: {
					name: "sap.ui.core"
				}
			}]
		}
	};
	const resources = ["", "_en", "_de"].map((lang) => {
		return {
			getPath: () => {
				return `${prefix}i18n(.*)./i18n(.*)${lang}.properties`;
			}
		};
	});

	// additional non-i18n resource
	resources.push({
		getPath: () => {
			return `${prefix}model/data.json`;
		}
	});
	t.is(errorLogStub.callCount, 0);

	const result = await manifestCreator({libraryResource, resources, options: {}});
	t.is(await result.getString(), expectedManifestContentSpecialChars, "Correct result returned");
});

test.serial("default manifest creation with special characters small app descriptor version", async (t) => {
	const {manifestCreator, errorLogStub} = t.context;
	const prefix = "/resources/sap/ui/mine/";
	const libraryResource = {
		getPath: () => {
			return prefix + ".library";
		},
		getString: async () => {
			return libraryContent;
		},
		_project: {
			dependencies: [{
				metadata: {
					name: "sap.ui.core"
				}
			}]
		}
	};
	const resources = ["", "_en", "_de"].map((lang) => {
		return {
			getPath: () => {
				return `${prefix}i18n/i18n${lang}.properties`;
			}
		};
	});
	t.is(errorLogStub.callCount, 0);

	const options = {descriptorVersion: new Version("1.9.0")};
	const result = await manifestCreator({libraryResource, resources, options});
	const expectedManifestContentSmallVersion = expectedManifestContentObject();
	expectedManifestContentSmallVersion["_version"] = "1.9.0";
	expectedManifestContentSmallVersion["sap.app"]["i18n"] = "i18n/i18n.properties";
	const expectedManifestContentSmallVersionString = JSON.stringify(expectedManifestContentSmallVersion, null, 2);
	t.is(await result.getString(), expectedManifestContentSmallVersionString, "Correct result returned");
});

test.serial("manifest creation for sap/apf", async (t) => {
	const {manifestCreator, errorLogStub, verboseLogStub} = t.context;

	const prefix = "/resources/sap/apf/";

	const libraryResource = {
		getPath: () => {
			return "/resources/sap/apf/.library";
		},
		getString: async () => {
			return libraryContent;
		},
		_project: {
			dependencies: [{
				metadata: {
					name: "sap.ui.core"
				}
			}]
		}
	};

	const componentResource = {
		getPath: () => {
			return prefix + "Component.js";
		}
	};
	const resources = ["", "_en", "_de"].map((lang) => {
		return {
			getPath: () => {
				return `${prefix}i18n/i18n${lang}.properties`;
			}
		};
	});
	resources.push(componentResource);
	const result = await manifestCreator({libraryResource, resources, options: {}});
	t.is(await result.getString(), expectedManifestContent, "Correct result returned");

	t.is(errorLogStub.callCount, 0);

	t.is(verboseLogStub.callCount, 10);
	t.is(verboseLogStub.getCall(0).args[0], "sap.app/i18n taken from .library appData: '%s'");
	t.is(verboseLogStub.getCall(1).args[0],
		"checking component at %s");
	t.is(verboseLogStub.getCall(1).args[1], "/resources/sap/apf");
	t.is(verboseLogStub.getCall(2).args[0],
		"Package %s contains both '*.library' and 'Component.js'. " +
		"This is a known issue but can't be solved due to backward compatibility.");
	t.is(verboseLogStub.getCall(2).args[1], "/resources/sap/apf");
});

test.serial("manifest creation for sap/ui/core", async (t) => {
	const {manifestCreator, errorLogStub, verboseLogStub} = t.context;

	const expectedManifestContent = JSON.stringify({
		"_version": "1.21.0",
		"sap.app": {
			"id": "sap.ui.core",
			"type": "library",
			"embeds": [],
			"applicationVersion": {
				"version": "1.0.0"
			},
			"title": "sap.ui.core",
			"resources": "resources.json",
			"offline": true
		},
		"sap.ui": {
			"technology": "UI5",
			"supportedThemes": []
		},
		"sap.ui5": {
			"dependencies": {
				"libs": {}
			},
			"library": {
				"i18n": false
			}
		}
	}, null, 2);

	const libraryResource = {
		getPath: () => {
			return "/resources/sap/ui/core/.library";
		},
		getString: async () => {
			return `<?xml version="1.0" encoding="UTF-8" ?>
			<library xmlns="http://www.sap.com/sap.ui.library.xsd" >
				<name>sap.ui.core</name>
				<version>1.0.0</version>
			</library>`;
		},
		_project: {
			metadata: {
				name: "sap.ui.core"
			}
		}
	};

	const componentResource = {
		getPath: () => {
			return "/resources/sap/ui/core/Component.js";
		}
	};

	const result = await manifestCreator({libraryResource, resources: [componentResource], options: {}});
	t.is(await result.getString(), expectedManifestContent, "Correct result returned");

	t.is(errorLogStub.callCount, 0);

	t.is(verboseLogStub.callCount, 8);
	t.is(verboseLogStub.getCall(1).args[0],
		"  sap.app/id taken from .library: '%s'");
	t.is(verboseLogStub.getCall(1).args[1], "sap.ui.core");
});

test.serial("manifest creation with .library / Component.js at same namespace", async (t) => {
	const {manifestCreator, errorLogStub, verboseLogStub} = t.context;

	const expectedManifestContent = JSON.stringify({
		"_version": "1.21.0",
		"sap.app": {
			"id": "sap.lib1",
			"type": "library",
			"embeds": [],
			"applicationVersion": {
				"version": "1.0.0"
			},
			"title": "sap.lib1",
			"resources": "resources.json",
			"offline": true
		},
		"sap.ui": {
			"technology": "UI5",
			"supportedThemes": []
		},
		"sap.ui5": {
			"dependencies": {
				"libs": {}
			},
			"library": {
				"i18n": false
			}
		}
	}, null, 2);

	const libraryResource = {
		getPath: () => {
			return "/resources/sap/lib1/.library";
		},
		getString: async () => {
			return `<?xml version="1.0" encoding="UTF-8" ?>
			<library xmlns="http://www.sap.com/sap.ui.library.xsd" >
				<name>sap.lib1</name>
				<version>1.0.0</version>
			</library>`;
		},
		_project: {
			dependencies: [{
				metadata: {
					name: "sap.ui.core"
				}
			}]
		}
	};

	const componentResource = {
		getPath: () => {
			return "/resources/sap/lib1/Component.js";
		}
	};

	const result = await manifestCreator({libraryResource, resources: [componentResource], options: {}});
	t.is(await result.getString(), expectedManifestContent, "Correct result returned");

	t.is(errorLogStub.callCount, 1);
	t.deepEqual(errorLogStub.getCall(0).args, [
		"Package %s contains both '*.library' and 'Component.js'. " +
		"This is not supported by manifests, therefore the component won't be " +
		"listed in the library's manifest.",
		"/resources/sap/lib1"
	]);

	t.is(verboseLogStub.callCount, 8);
	t.is(verboseLogStub.getCall(1).args[0],
		"  sap.app/id taken from .library: '%s'");
	t.is(verboseLogStub.getCall(1).args[1], "sap.lib1");
});

test.serial("manifest creation with embedded component", async (t) => {
	const {manifestCreator, errorLogStub, verboseLogStub} = t.context;

	const expectedManifestContent = JSON.stringify({
		"_version": "1.21.0",
		"sap.app": {
			"id": "sap.lib1",
			"type": "library",
			"embeds": [
				"component1"
			],
			"applicationVersion": {
				"version": "1.0.0"
			},
			"title": "sap.lib1",
			"resources": "resources.json",
			"offline": true
		},
		"sap.ui": {
			"technology": "UI5",
			"supportedThemes": []
		},
		"sap.ui5": {
			"dependencies": {
				"libs": {}
			},
			"library": {
				"i18n": false
			}
		}
	}, null, 2);

	const libraryResource = {
		getPath: () => {
			return "/resources/sap/lib1/.library";
		},
		getString: async () => {
			return `<?xml version="1.0" encoding="UTF-8" ?>
			<library xmlns="http://www.sap.com/sap.ui.library.xsd" >
				<name>sap.lib1</name>
				<version>1.0.0</version>
			</library>`;
		},
		_project: {
			dependencies: [{
				metadata: {
					name: "sap.ui.core"
				}
			}]
		}
	};

	const componentResource = {
		getPath: () => {
			return "/resources/sap/lib1/component1/Component.js";
		}
	};
	const componentManifestResource = {
		getPath: () => {
			return "/resources/sap/lib1/component1/manifest.json";
		},
		getString: async () => {
			return JSON.stringify({
				"sap.app": {
					"embeddedBy": "../"
				}
			});
		}
	};

	const result = await manifestCreator({
		libraryResource,
		resources: [
			componentResource,
			componentManifestResource
		]
	});
	t.is(await result.getString(), expectedManifestContent, "Correct result returned");

	t.is(errorLogStub.callCount, 0);

	t.true(verboseLogStub.callCount >= 2, "There should be at least 2 verbose log calls");
	t.deepEqual(verboseLogStub.getCall(0).args, [
		"checking component at %s", "/resources/sap/lib1/component1"
	]);
	t.deepEqual(verboseLogStub.getCall(1).args, [
		"  component's 'sap.app/embeddedBy' property points to library, list it as 'embedded'"
	]);
});

test.serial("manifest creation with embedded component (Missing 'embeddedBy')", async (t) => {
	const {manifestCreator, errorLogStub, verboseLogStub} = t.context;

	const expectedManifestContent = JSON.stringify({
		"_version": "1.21.0",
		"sap.app": {
			"id": "sap.lib1",
			"type": "library",
			"embeds": [],
			"applicationVersion": {
				"version": "1.0.0"
			},
			"title": "sap.lib1",
			"resources": "resources.json",
			"offline": true
		},
		"sap.ui": {
			"technology": "UI5",
			"supportedThemes": []
		},
		"sap.ui5": {
			"dependencies": {
				"libs": {}
			},
			"library": {
				"i18n": false
			}
		}
	}, null, 2);

	const libraryResource = {
		getPath: () => {
			return "/resources/sap/lib1/.library";
		},
		getString: async () => {
			return `<?xml version="1.0" encoding="UTF-8" ?>
			<library xmlns="http://www.sap.com/sap.ui.library.xsd" >
				<name>sap.lib1</name>
				<version>1.0.0</version>
			</library>`;
		},
		_project: {
			dependencies: [{
				metadata: {
					name: "sap.ui.core"
				}
			}]
		}
	};

	const componentResource = {
		getPath: () => {
			return "/resources/sap/lib1/component1/Component.js";
		}
	};
	const componentManifestResource = {
		getPath: () => {
			return "/resources/sap/lib1/component1/manifest.json";
		},
		getString: async () => {
			return JSON.stringify({});
		}
	};

	const result = await manifestCreator({
		libraryResource,
		resources: [
			componentResource,
			componentManifestResource
		]
	});
	t.is(await result.getString(), expectedManifestContent, "Correct result returned");

	t.is(errorLogStub.callCount, 0);

	t.true(verboseLogStub.callCount >= 2, "There should be at least 2 verbose log calls");
	t.deepEqual(verboseLogStub.getCall(0).args, [
		"checking component at %s", "/resources/sap/lib1/component1"
	]);
	t.deepEqual(verboseLogStub.getCall(1).args, [
		"  component doesn't declare 'sap.app/embeddedBy', don't list it as 'embedded'"
	]);
});

test.serial("manifest creation with embedded component ('embeddedBy' doesn't point to library)", async (t) => {
	const {manifestCreator, errorLogStub, verboseLogStub} = t.context;

	const expectedManifestContent = JSON.stringify({
		"_version": "1.21.0",
		"sap.app": {
			"id": "sap.lib1",
			"type": "library",
			"embeds": [],
			"applicationVersion": {
				"version": "1.0.0"
			},
			"title": "sap.lib1",
			"resources": "resources.json",
			"offline": true
		},
		"sap.ui": {
			"technology": "UI5",
			"supportedThemes": []
		},
		"sap.ui5": {
			"dependencies": {
				"libs": {}
			},
			"library": {
				"i18n": false
			}
		}
	}, null, 2);

	const libraryResource = {
		getPath: () => {
			return "/resources/sap/lib1/.library";
		},
		getString: async () => {
			return `<?xml version="1.0" encoding="UTF-8" ?>
			<library xmlns="http://www.sap.com/sap.ui.library.xsd" >
				<name>sap.lib1</name>
				<version>1.0.0</version>
			</library>`;
		},
		_project: {
			dependencies: [{
				metadata: {
					name: "sap.ui.core"
				}
			}]
		}
	};

	const componentResource = {
		getPath: () => {
			return "/resources/sap/lib1/component1/Component.js";
		}
	};
	const componentManifestResource = {
		getPath: () => {
			return "/resources/sap/lib1/component1/manifest.json";
		},
		getString: async () => {
			return JSON.stringify({
				"sap.app": {
					"embeddedBy": "../foo/"
				}
			});
		}
	};

	const result = await manifestCreator({
		libraryResource,
		resources: [
			componentResource,
			componentManifestResource
		]
	});
	t.is(await result.getString(), expectedManifestContent, "Correct result returned");

	t.is(errorLogStub.callCount, 0);

	t.true(verboseLogStub.callCount >= 2, "There should be at least 2 verbose log calls");
	t.deepEqual(verboseLogStub.getCall(0).args, [
		"checking component at %s", "/resources/sap/lib1/component1"
	]);
	t.deepEqual(verboseLogStub.getCall(1).args, [
		"  component's 'sap.app/embeddedBy' points to '%s', don't list it as 'embedded'",
		"/resources/sap/lib1/foo/"
	]);
});

test.serial("manifest creation with embedded component ('embeddedBy' absolute path)", async (t) => {
	const {manifestCreator, errorLogStub, verboseLogStub} = t.context;

	const expectedManifestContent = JSON.stringify({
		"_version": "1.21.0",
		"sap.app": {
			"id": "sap.lib1",
			"type": "library",
			"embeds": [],
			"applicationVersion": {
				"version": "1.0.0"
			},
			"title": "sap.lib1",
			"resources": "resources.json",
			"offline": true
		},
		"sap.ui": {
			"technology": "UI5",
			"supportedThemes": []
		},
		"sap.ui5": {
			"dependencies": {
				"libs": {}
			},
			"library": {
				"i18n": false
			}
		}
	}, null, 2);

	const libraryResource = {
		getPath: () => {
			return "/resources/sap/lib1/.library";
		},
		getString: async () => {
			return `<?xml version="1.0" encoding="UTF-8" ?>
			<library xmlns="http://www.sap.com/sap.ui.library.xsd" >
				<name>sap.lib1</name>
				<version>1.0.0</version>
			</library>`;
		},
		_project: {
			dependencies: [{
				metadata: {
					name: "sap.ui.core"
				}
			}]
		}
	};

	const componentResource = {
		getPath: () => {
			return "/resources/sap/lib1/component1/Component.js";
		}
	};
	const componentManifestResource = {
		getPath: () => {
			return "/resources/sap/lib1/component1/manifest.json";
		},
		getString: async () => {
			return JSON.stringify({
				"sap.app": {
					"embeddedBy": "/"
				}
			});
		}
	};

	const result = await manifestCreator({
		libraryResource,
		resources: [
			componentResource,
			componentManifestResource
		]
	});
	t.is(await result.getString(), expectedManifestContent, "Correct result returned");

	t.is(errorLogStub.callCount, 0);

	t.true(verboseLogStub.callCount >= 2, "There should be at least 2 verbose log calls");
	t.deepEqual(verboseLogStub.getCall(0).args, [
		"checking component at %s", "/resources/sap/lib1/component1"
	]);
	t.deepEqual(verboseLogStub.getCall(1).args, [
		"  component's 'sap.app/embeddedBy' points to '%s', don't list it as 'embedded'",
		"/"
	]);
});

test.serial("manifest creation with embedded component ('embeddedBy' empty string)", async (t) => {
	const {manifestCreator, errorLogStub} = t.context;

	const expectedManifestContent = JSON.stringify({
		"_version": "1.21.0",
		"sap.app": {
			"id": "sap.lib1",
			"type": "library",
			"embeds": [],
			"applicationVersion": {
				"version": "1.0.0"
			},
			"title": "sap.lib1",
			"resources": "resources.json",
			"offline": true
		},
		"sap.ui": {
			"technology": "UI5",
			"supportedThemes": []
		},
		"sap.ui5": {
			"dependencies": {
				"libs": {}
			},
			"library": {
				"i18n": false
			}
		}
	}, null, 2);

	const libraryResource = {
		getPath: () => {
			return "/resources/sap/lib1/.library";
		},
		getString: async () => {
			return `<?xml version="1.0" encoding="UTF-8" ?>
			<library xmlns="http://www.sap.com/sap.ui.library.xsd" >
				<name>sap.lib1</name>
				<version>1.0.0</version>
			</library>`;
		},
		_project: {
			dependencies: [{
				metadata: {
					name: "sap.ui.core"
				}
			}]
		}
	};

	const componentResource = {
		getPath: () => {
			return "/resources/sap/lib1/component1/Component.js";
		}
	};
	const componentManifestResource = {
		getPath: () => {
			return "/resources/sap/lib1/component1/manifest.json";
		},
		getString: async () => {
			return JSON.stringify({
				"sap.app": {
					"embeddedBy": ""
				}
			});
		}
	};

	const result = await manifestCreator({
		libraryResource,
		resources: [
			componentResource,
			componentManifestResource
		]
	});
	t.is(await result.getString(), expectedManifestContent, "Correct result returned");

	t.is(errorLogStub.callCount, 1);
	t.deepEqual(errorLogStub.getCall(0).args, [
		"  component '%s': property 'sap.app/embeddedBy' has an empty string value (which is invalid), " +
		"it won't be listed as 'embedded'",
		"/resources/sap/lib1/component1"
	]);
});

test.serial("manifest creation with embedded component ('embeddedBy' object)", async (t) => {
	const {manifestCreator, errorLogStub} = t.context;

	const expectedManifestContent = JSON.stringify({
		"_version": "1.21.0",
		"sap.app": {
			"id": "sap.lib1",
			"type": "library",
			"embeds": [],
			"applicationVersion": {
				"version": "1.0.0"
			},
			"title": "sap.lib1",
			"resources": "resources.json",
			"offline": true
		},
		"sap.ui": {
			"technology": "UI5",
			"supportedThemes": []
		},
		"sap.ui5": {
			"dependencies": {
				"libs": {}
			},
			"library": {
				"i18n": false
			}
		}
	}, null, 2);

	const libraryResource = {
		getPath: () => {
			return "/resources/sap/lib1/.library";
		},
		getString: async () => {
			return `<?xml version="1.0" encoding="UTF-8" ?>
			<library xmlns="http://www.sap.com/sap.ui.library.xsd" >
				<name>sap.lib1</name>
				<version>1.0.0</version>
			</library>`;
		},
		_project: {
			dependencies: [{
				metadata: {
					name: "sap.ui.core"
				}
			}]
		}
	};

	const componentResource = {
		getPath: () => {
			return "/resources/sap/lib1/component1/Component.js";
		}
	};
	const componentManifestResource = {
		getPath: () => {
			return "/resources/sap/lib1/component1/manifest.json";
		},
		getString: async () => {
			return JSON.stringify({
				"sap.app": {
					"embeddedBy": {
						"foo": "bar"
					}
				}
			});
		}
	};

	const result = await manifestCreator({
		libraryResource,
		resources: [
			componentResource,
			componentManifestResource
		]
	});
	t.is(await result.getString(), expectedManifestContent, "Correct result returned");

	t.is(errorLogStub.callCount, 1);
	t.deepEqual(errorLogStub.getCall(0).args, [
		"  component '%s': property 'sap.app/embeddedBy' is of type '%s' (expected 'string'), " +
		"it won't be listed as 'embedded'",
		"/resources/sap/lib1/component1",
		"object"
	]);
});

test.serial("manifest creation with embedded component (no manifest.json)", async (t) => {
	const {manifestCreator, errorLogStub, verboseLogStub} = t.context;

	const expectedManifestContent = JSON.stringify({
		"_version": "1.21.0",
		"sap.app": {
			"id": "sap.lib1",
			"type": "library",
			"embeds": [],
			"applicationVersion": {
				"version": "1.0.0"
			},
			"title": "sap.lib1",
			"resources": "resources.json",
			"offline": true
		},
		"sap.ui": {
			"technology": "UI5",
			"supportedThemes": []
		},
		"sap.ui5": {
			"dependencies": {
				"libs": {}
			},
			"library": {
				"i18n": false
			}
		}
	}, null, 2);

	const libraryResource = {
		getPath: () => {
			return "/resources/sap/lib1/.library";
		},
		getString: async () => {
			return `<?xml version="1.0" encoding="UTF-8" ?>
			<library xmlns="http://www.sap.com/sap.ui.library.xsd" >
				<name>sap.lib1</name>
				<version>1.0.0</version>
			</library>`;
		},
		_project: {
			dependencies: [{
				metadata: {
					name: "sap.ui.core"
				}
			}]
		}
	};

	const componentResource = {
		getPath: () => {
			return "/resources/sap/lib1/component1/Component.js";
		}
	};

	const result = await manifestCreator({
		libraryResource,
		resources: [
			componentResource
		]
	});
	t.is(await result.getString(), expectedManifestContent, "Correct result returned");

	t.is(errorLogStub.callCount, 0);

	t.true(verboseLogStub.callCount >= 2, "There should be at least 2 verbose log calls");
	t.deepEqual(verboseLogStub.getCall(0).args, [
		"checking component at %s",
		"/resources/sap/lib1/component1"
	]);
	t.deepEqual(verboseLogStub.getCall(1).args, [
		"  component has no accompanying manifest.json, don't list it as 'embedded'"
	]);
});

test.serial("manifest creation with embedded component (invalid manifest.json)", async (t) => {
	const {manifestCreator, errorLogStub} = t.context;

	const expectedManifestContent = JSON.stringify({
		"_version": "1.21.0",
		"sap.app": {
			"id": "sap.lib1",
			"type": "library",
			"embeds": [],
			"applicationVersion": {
				"version": "1.0.0"
			},
			"title": "sap.lib1",
			"resources": "resources.json",
			"offline": true
		},
		"sap.ui": {
			"technology": "UI5",
			"supportedThemes": []
		},
		"sap.ui5": {
			"dependencies": {
				"libs": {}
			},
			"library": {
				"i18n": false
			}
		}
	}, null, 2);

	const libraryResource = {
		getPath: () => {
			return "/resources/sap/lib1/.library";
		},
		getString: async () => {
			return `<?xml version="1.0" encoding="UTF-8" ?>
			<library xmlns="http://www.sap.com/sap.ui.library.xsd" >
				<name>sap.lib1</name>
				<version>1.0.0</version>
			</library>`;
		},
		_project: {
			dependencies: [{
				metadata: {
					name: "sap.ui.core"
				}
			}]
		}
	};

	const componentResource = {
		getPath: () => {
			return "/resources/sap/lib1/component1/Component.js";
		}
	};
	const componentManifestResource = {
		getPath: () => {
			return "/resources/sap/lib1/component1/manifest.json";
		},
		getString: async () => {
			return "{invalid}";
		}
	};

	const result = await manifestCreator({
		libraryResource,
		resources: [
			componentResource,
			componentManifestResource
		]
	});
	t.is(await result.getString(), expectedManifestContent, "Correct result returned");

	t.is(errorLogStub.callCount, 1);
	t.is(errorLogStub.getCall(0).args.length, 3);
	t.deepEqual(errorLogStub.getCall(0).args.slice(0, 2), [
		"  component '%s': failed to read the component's manifest.json, " +
		"it won't be listed as 'embedded'.\n" +
		"Error details: %s",
		"/resources/sap/lib1/component1"
	]);
	t.true(errorLogStub.getCall(0).args[2].startsWith("SyntaxError: Unexpected token"));
});

test.serial("manifest creation for invalid .library content", async (t) => {
	const {manifestCreator} = t.context;

	const libraryResource = {
		getPath: () => {
			return "/resources/sap/lib1/.library";
		},
		getString: async () => {
			return `<?xml version="1.0" encoding="UTF-8" ?>
			<<>`;
		}
	};

	const error = await t.throwsAsync(manifestCreator({
		libraryResource,
		resources: []
	}));
	t.deepEqual(error.message, `Unencoded <
Line: 1
Column: 5
Char: <`, "error message for unencoded <");
});
