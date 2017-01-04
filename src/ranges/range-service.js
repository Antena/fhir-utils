'use strict';

/**
 * @namespace ranges/range-service
 *
 * @description
 * Provides some utilitary functions for filtering out observation referenceRanges which are not relevant for the given patient data.
 *
 */

var _ = require('underscore');

module.exports = function() {

	var LOW_RANGE_COMPARATOR_DEFAULT = '>=';
	var HIGH_RANGE_COMPARATOR_DEFAULT = '<=';

	/**
	 * @static
	 * @memberOf ranges/range-service
	 *
	 * @description
	 * Provides operation functions for {@link https://www.hl7.org/fhir/2015MAY/quantity-comparator.html quantity comparators}
	 * with addition of  '=='
	 *
	 * @enum {function}
	 */
	// jscs:disable requireBlocksOnNewline
	var QUANTITY_COMPARATOR_OPERATORS = {
		'<': function(a, b) { return a < b; },
		'<=': function(a, b) { return a <= b; },
		'>=': function(a, b) { return a >= b; },
		'>': function(a, b) { return a > b; },
		'==': function(a, b) { return a === b; }

	};
	// jscs:enable requireBlocksOnNewline

	/**
	 * @static
	 * @memberOf ranges/range-service
	 *
	 * @description
	 * Converts an age quantity in any of these units to years: months (code 'mo'), months (code 'd'), months (code 'wk'). For more info see {@link http://download.hl7.de/documents/ucum/ucumdata.html full list of UCUM codes}.
	 *
	 * @param {Object} ageQuantity An age {@link https://www.hl7.org/fhir/2015MAY/datatypes.html#Range FHIR Quantity} to convert. See {@link https://www.hl7.org/fhir/2015MAY/observation-definitions.html#Observation.referenceRange.age Observation.referenceRange.age} for more info.
	 *
	 * @return {Number} The quantity value transformed to years.
	 *
	 */
	function valueToYears(ageQuantity) {
		var result;
		if (ageQuantity && ageQuantity.code && _.isNumber(ageQuantity.value)) {
			if (ageQuantity.code === 'mo') {
				result = ageQuantity.value / 12;
			} else if (ageQuantity.code === 'd') {
				result = ageQuantity.value / 365;
			} else if (ageQuantity.code === 'wk') {
				result = ageQuantity.value * 7 / 365;
			} else {
				result = ageQuantity.value;
			}
		}
		return result;
	}

	/**
	 * @static
	 * @memberOf ranges/range-service
	 *
	 * @description
	 * Determines if a value fits in a specified range.
	 *
	 * @param {Number} value: the value.
	 * @param {Object} range A {@link https://www.hl7.org/fhir/2015MAY/datatypes.html#Range FHIR Range} to inspect.
	 *
	 * @return {Boolean}
	 *
	 */
	function valueInRange(value, range) {
		var result = false;

		var lowQuantityComparator = !!range.low && !!range.low.comparator ? range.low.comparator : LOW_RANGE_COMPARATOR_DEFAULT;
		var lowOperator = QUANTITY_COMPARATOR_OPERATORS[lowQuantityComparator];
		var highQuantityComparator = !!range.high && !!range.high.comparator ? range.high.comparator : HIGH_RANGE_COMPARATOR_DEFAULT;
		var highOperator = QUANTITY_COMPARATOR_OPERATORS[highQuantityComparator];

		if (!!range.low && !!range.high) {
			result = lowOperator(value, range.low.value) && highOperator(value, range.high.value);
		} else if (!!range.low && !range.high) {
			result = lowOperator(value, range.low.value);
		} else if (!!range.high && !range.low) {
			result = highOperator(value, range.high.value);
		}

		return result;
	}

	/**
	 * @static
	 * @memberOf ranges/range-service
	 *
	 * @description
	 * Checks whether or not a range is appropriate given the patient's age. Supports all standard {@link https://www.hl7.org/fhir/2015MAY/quantity-comparator.html quantity comparators} plus `equals` ('==').
	 *
	 * @param {Object} range A {@link https://www.hl7.org/fhir/2015MAY/datatypes.html#Range FHIR Range} to inspect.
	 * @param {Number} patientAgeInYearsAtMomentOfReport The age of the patient at the moment the DiagnosticReport was generated, in years (decimal number).
	 *
	 * @return {Boolean} Returns true if this range is appropriate for the given patient's age.
	 *
	 */
	function isRangeAgeAppropriate(range, patientAgeInYearsAtMomentOfReport) {

		var lowOK = true,
			highOK = true,
			op;

		if (range.low) {
			op = range.low.comparator || LOW_RANGE_COMPARATOR_DEFAULT;
			var rangeLowValueInYears = range.low.value;
			if (range.low.code !== 'a') {
				rangeLowValueInYears = valueToYears(range.low);
			}
			lowOK = QUANTITY_COMPARATOR_OPERATORS[op](patientAgeInYearsAtMomentOfReport, rangeLowValueInYears);
		}

		if (range.high) {
			op = range.high.comparator || HIGH_RANGE_COMPARATOR_DEFAULT;
			var rangeHighValueInYears = range.high.value;
			if (range.high.code !== 'a') {
				rangeHighValueInYears = valueToYears(range.high);
			}
			highOK = QUANTITY_COMPARATOR_OPERATORS[op](patientAgeInYearsAtMomentOfReport, rangeHighValueInYears);
		}

		return lowOK && highOK;
	}

	/**
	 * @static
	 * @memberOf ranges/range-service
	 *
	 * @description
	 * Filters ranges that are age or gender specific, given the patient data.
	 *
	 * @param {Array} referenceRanges A list of {@link https://www.hl7.org/fhir/2015MAY/datatypes.html#Range FHIR ranges} to filter.
	 * @param {Number} patientAgeInYears The age of the patient at the moment the DiagnosticReport was generated, in years (decimal number). If available, ranges that are age-specific will be filtered accordingly.
	 * @param {String} patientGender A string representation of the patient gender ({@link http://hl7.org/fhir/ValueSet/administrative-gender valid values}). If available, ranges that are gender-specific will be filtered accordingly.
	 *
	 * @return {Array} The list of ranges that apply given the patient's age.
	 *
	 */
	function filterRanges(referenceRanges, patientAgeInYears, patientGender) {
		return _.filter(referenceRanges, function(range) {
			var genderConditioned = _.findWhere(range.modifierExtension, { url: "http://hl7.org/fhir/ValueSet/administrative-gender" });
			var appliesGenderWise = !patientGender || !genderConditioned || genderConditioned.valueCode === patientGender;
			var appliesAgeWise = !range.age || !patientAgeInYears || isRangeAgeAppropriate(range.age, patientAgeInYears);

			return appliesGenderWise && appliesAgeWise;
		});
	}

	return {
		filterRanges: filterRanges,
		isRangeAgeAppropriate: isRangeAgeAppropriate,
		valueToYears: valueToYears,
		valueInRange: valueInRange,
		QUANTITY_COMPARATOR_OPERATORS: QUANTITY_COMPARATOR_OPERATORS
	};
};
