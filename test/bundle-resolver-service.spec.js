'use strict';

var should = require("should"),
	_ = require('underscore'),
	BundleResolverService = require("../src/bundle/bundle-resolver-service")(),
	demoBundle = require('./data/bundle.json');

describe("Bundle Resolver Service", function() {

	it("should properly embed referenced resources", function() {

		var bundle = BundleResolverService.resolveOrderAndReportReferences(demoBundle, "123456");
		should.exist(bundle);
		should.exist(bundle.diagnosticOrder);
		should.exist(bundle.diagnosticReport);
		should.exist(bundle.observations);
		bundle.observations.length.should.equal(16);	// 16 groups, 75 total
		var resourceTypeList = _.uniq(_.pluck(bundle.observations, 'resourceType'));
		resourceTypeList.length.should.equal(1);
		resourceTypeList[0].should.equal('Observation');
		bundle.diagnosticOrder.identifier[0].value.should.equal('123456');
		bundle.diagnosticReport.requestDetail[0].identifier[0].value.should.equal('123456');

	});
});
