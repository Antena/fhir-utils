'use strict';

var should = require("should"),
	_ = require('underscore'),
	RangeService = require("../src/ranges/range-service")(),
	demoRanges = require('./data/referenceRanges.json');

describe("Range Service", function() {

	describe("QUANTITY_COMPARATOR_OPERATORS", function() {
		var t1Params = [5, 8];
		var t2Params = [5, 5.211231];
		var t3Params = [5, 5];
		var t4Params = [13, 5];

		it("should properly evaluate less than (<) operator", function() {

			var op = '<';
			var isLessThanInt = RangeService.QUANTITY_COMPARATOR_OPERATORS[op](t1Params[0], t1Params[1]);
			var isLessThanDouble = RangeService.QUANTITY_COMPARATOR_OPERATORS[op](t2Params[0], t2Params[1]);
			var isEqual = RangeService.QUANTITY_COMPARATOR_OPERATORS[op](t3Params[0], t3Params[1]);
			var isGreaterThan = RangeService.QUANTITY_COMPARATOR_OPERATORS[op](t4Params[0], t4Params[1]);

			isLessThanInt.should.be.true();
			isLessThanDouble.should.be.true();
			isEqual.should.be.false();
			isGreaterThan.should.be.false();
		});

		it("should properly evaluate less than equal (<=) operator", function() {

			var op = '<=';
			var isLessThanInt = RangeService.QUANTITY_COMPARATOR_OPERATORS[op](t1Params[0], t1Params[1]);
			var isLessThanDouble = RangeService.QUANTITY_COMPARATOR_OPERATORS[op](t2Params[0], t2Params[1]);
			var isEqual = RangeService.QUANTITY_COMPARATOR_OPERATORS[op](t3Params[0], t3Params[1]);
			var isGreaterThan = RangeService.QUANTITY_COMPARATOR_OPERATORS[op](t4Params[0], t4Params[1]);

			isLessThanInt.should.be.true();
			isLessThanDouble.should.be.true();
			isEqual.should.be.true();
			isGreaterThan.should.be.false();
		});

		it("should properly evaluate greater than equal (>=) operator", function() {

			var op = '>=';
			var isLessThanInt = RangeService.QUANTITY_COMPARATOR_OPERATORS[op](t1Params[0], t1Params[1]);
			var isLessThanDouble = RangeService.QUANTITY_COMPARATOR_OPERATORS[op](t2Params[0], t2Params[1]);
			var isEqual = RangeService.QUANTITY_COMPARATOR_OPERATORS[op](t3Params[0], t3Params[1]);
			var isGreaterThan = RangeService.QUANTITY_COMPARATOR_OPERATORS[op](t4Params[0], t4Params[1]);

			isLessThanInt.should.be.false();
			isLessThanDouble.should.be.false();
			isEqual.should.be.true();
			isGreaterThan.should.be.true();
		});

		it("should properly evaluate greater than (>) operator", function() {

			var op = '>';
			var isLessThanInt = RangeService.QUANTITY_COMPARATOR_OPERATORS[op](t1Params[0], t1Params[1]);
			var isLessThanDouble = RangeService.QUANTITY_COMPARATOR_OPERATORS[op](t2Params[0], t2Params[1]);
			var isEqual = RangeService.QUANTITY_COMPARATOR_OPERATORS[op](t3Params[0], t3Params[1]);
			var isGreaterThan = RangeService.QUANTITY_COMPARATOR_OPERATORS[op](t4Params[0], t4Params[1]);

			isLessThanInt.should.be.false();
			isLessThanDouble.should.be.false();
			isEqual.should.be.false();
			isGreaterThan.should.be.true();
		});

		it("should properly evaluate equal (==) operator", function() {

			var op = '==';
			var isLessThanInt = RangeService.QUANTITY_COMPARATOR_OPERATORS[op](t1Params[0], t1Params[1]);
			var isLessThanDouble = RangeService.QUANTITY_COMPARATOR_OPERATORS[op](t2Params[0], t2Params[1]);
			var isEqual = RangeService.QUANTITY_COMPARATOR_OPERATORS[op](t3Params[0], t3Params[1]);
			var isGreaterThan = RangeService.QUANTITY_COMPARATOR_OPERATORS[op](t4Params[0], t4Params[1]);

			isLessThanInt.should.be.false();
			isLessThanDouble.should.be.false();
			isEqual.should.be.true();
			isGreaterThan.should.be.false();
		});
	});

	describe("valueToYears", function() {

		var ageQuantityInYears = {
			high: {
				code: "a",
				system: "http://unitsofmeasure.org",
				unit: "years",
				value: 0.5,
				comparator: "<="
			}
		};

		var ageQuantityInMonths = {
			high: {
				code: "mo",
				system: "http://unitsofmeasure.org",
				unit: "months",
				value: 5,
				comparator: "<="
			}
		};

		var ageQuantityInWeeks = {
			high: {
				code: "wk",
				system: "http://unitsofmeasure.org",
				unit: "weeks",
				value: 12,
				comparator: "<="
			}
		};

		var ageQuantityInDays = {
			high: {
				code: "d",
				system: "http://unitsofmeasure.org",
				unit: "days",
				value: 30,
				comparator: "<="
			}
		};

		it("should return same value if input is years", function() {
			RangeService.valueToYears(ageQuantityInYears.high).should.be.eql(ageQuantityInYears.high.value);
		});

		it("should properly convert months to years", function() {
			RangeService.valueToYears(ageQuantityInMonths.high).should.be.eql(ageQuantityInMonths.high.value / 12);
		});

		it("should properly convert weeks to years", function() {
			RangeService.valueToYears(ageQuantityInWeeks.high).should.be.eql(ageQuantityInWeeks.high.value * 7 / 365);
		});

		it("should properly convert days to years", function() {
			RangeService.valueToYears(ageQuantityInDays.high).should.be.eql(ageQuantityInDays.high.value / 365);
		});

		it("should return undefined if parameter is invalid", function() {
			should.not.exist(RangeService.valueToYears(ageQuantityInDays));
		});
	});

	describe("filterRanges", function() {

		it("should properly filter age appropriate ranges", function() {
			var filteredRanges = RangeService.filterRanges(demoRanges.referenceRange, 6, 'female');
			var expected = [demoRanges.referenceRange[2]];
			filteredRanges.should.be.eql(expected);
		});

		it("should return empty array if no age-appropriate range found", function() {
			var filteredRanges = RangeService.filterRanges(_.first(demoRanges.referenceRange, 2), 6, 'female');
			filteredRanges.should.be.eql([]);
		});
	});

	describe("valueInRange", function() {

		it("should properly detect if value falls within a range w/ comparators", function() {
			var excludingEdgesRange = demoRanges.referenceRangeWithComparator[0];
			RangeService.valueInRange(0.5, excludingEdgesRange).should.be.false();
			RangeService.valueInRange(2.5, excludingEdgesRange).should.be.false();
			RangeService.valueInRange(0.55, excludingEdgesRange).should.be.true();
			RangeService.valueInRange(2.45, excludingEdgesRange).should.be.true();

			var excludingLowEdgeRange = demoRanges.referenceRangeWithComparator[1];
			RangeService.valueInRange(0.5, excludingLowEdgeRange).should.be.false();
			RangeService.valueInRange(2.5, excludingLowEdgeRange).should.be.true();
			RangeService.valueInRange(0.55, excludingLowEdgeRange).should.be.true();
			RangeService.valueInRange(2.45, excludingLowEdgeRange).should.be.true();

			var excludingHighEdgeRange = demoRanges.referenceRangeWithComparator[2];
			RangeService.valueInRange(0.5, excludingHighEdgeRange).should.be.true();
			RangeService.valueInRange(2.5, excludingHighEdgeRange).should.be.false();
			RangeService.valueInRange(0.55, excludingHighEdgeRange).should.be.true();
			RangeService.valueInRange(2.45, excludingHighEdgeRange).should.be.true();
		});

		it("should properly detect if value falls within a range w/o comparators", function() {
			var includingEdgesRange = demoRanges.referenceRange[0];
			RangeService.valueInRange(0.5, includingEdgesRange).should.be.true();
			RangeService.valueInRange(2.5, includingEdgesRange).should.be.true();
			RangeService.valueInRange(0.55, includingEdgesRange).should.be.true();
			RangeService.valueInRange(2.45, includingEdgesRange).should.be.true();
			RangeService.valueInRange(0.45, includingEdgesRange).should.be.false();
			RangeService.valueInRange(2.55, includingEdgesRange).should.be.false();
		});
	});
});
