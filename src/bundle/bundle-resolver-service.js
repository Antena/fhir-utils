'use strict';

/**
 * @namespace bundle/bundle-resolver-service
 *
 * @description
 * Given a valid FHIR bundle, embeds referenced resources.
 *
 * <div style="color: #c09853; background-color: #fcf8e3; border: 1px solid #fbeed5; padding: 10px; margin: 10px 0;">
 * <p style="font-family: Helvetica; font-weight: bold;">Note: this service only supports a few types of FHIR resources for the moment.</p>
 *
 * List of supported resource types:
 * <ul>
 *     <li><a href="https://www.hl7.org/fhir/2015MAY/diagnosticorder.html">DiagnosticOrder</a></li>
 *     <li><a href="https://www.hl7.org/fhir/2015MAY/practitioner.html">Practitioner</a></li>
 *     <li><a href="https://www.hl7.org/fhir/2015MAY/patient.html">Patient</a></li>
 *     <li><a href="https://www.hl7.org/fhir/2015MAY/organization.html">Organization</a></li>
 *     <li><a href="https://www.hl7.org/fhir/2015MAY/diagnosticreport.html">DiagnosticReport</a></li>
 *     <li><a href="https://www.hl7.org/fhir/2015MAY/observation.html">Observation</a></li>
 * </ul>
 * </div>
 *
 * See the individual methods for more information and examples.
 *
 */

var _ = require('underscore');
var cloneDeep = require('lodash/cloneDeep');

// @ngInject
module.exports = function() {
	function getReferencedId(reference) {
		var lastSlash = _.lastIndexOf(reference, '/');
		return lastSlash > -1 ? reference.substring(lastSlash + 1, reference.length) : null;
	}

	function resolveFromOrder(order, fhirBundleResources) {
		// orderer is optional
		if (order.orderer) {
			order.orderer = cloneDeep(_.findWhere(fhirBundleResources, {
				resourceType: "Practitioner",
				id: getReferencedId(order.orderer.reference)
			}));
		}

		order.subject = cloneDeep(_.findWhere(fhirBundleResources, {
			resourceType: "Patient",
			id: getReferencedId(order.subject.reference)
		}));

		return order;
	}

	function resolveOrder(fhirBundleResources, orderReference) {
		var searchParams = {resourceType: "DiagnosticOrder"};
		if (orderReference) {
			searchParams.id = orderReference;
		}

		var order = cloneDeep(_.findWhere(fhirBundleResources, searchParams));

		return resolveFromOrder(order, fhirBundleResources);
	}

	function resolveRelatedObservations(realObs, fhirBundleResources) {
		if (realObs.related) {
			realObs.related = _.filter(realObs.related, function(relatedObs) {
				return getReferencedId(relatedObs.target.reference) !== realObs.id;
			});

			realObs.related = _.map(realObs.related, function(relatedObs) {
				var resolved;

				if (relatedObs.target && relatedObs.target.reference) {
					var tempResolved = { type: relatedObs.type };
					tempResolved.target = _.findWhere(fhirBundleResources, {
						resourceType: "Observation",
						id: getReferencedId(relatedObs.target.reference)
					});
					resolved = tempResolved;
					resolveRelatedObservations(resolved.target, fhirBundleResources);
				} else {
					resolved = relatedObs;
				}

				return resolved;
			});
		}
	}

	return {

		/**
		 * @static
		 * @memberOf bundle/bundle-resolver-service
		 *
		 * @description
		 *
		 * Takes a FHIR bundle, and resolves all references starting from a `DiagnosticOrder`. If a orderValueIdentifier is provided,
		 * that `DiagnosticOrder` will be used. Otherwise, the first DiagnosticOrder in the bundle will be chosen.
		 *
		 * @param {Object} fhirBundle A valid FHIR bundle.
		 * @param {String=} orderValueIdentifier The order identifier value from which all resolutions begin (`order.identifier[0].value`)
		 *
		 * @return {Object} The resolved bundle, with the following structure:
		 * ```js
		 * {
		 *   // each of these contains all embedded resources (orderer, subject, etc)
		 *   diagnosticOrder: order,
		 *   diagnosticReport: report,
		 *   observations: report.result
		 * };
		 *
		 */
		resolveOrderAndReportReferences: function(fhirBundle, orderValueIdentifier) {

			var fhirBundleResources = _.pluck(fhirBundle.entry, 'resource');

			/* Order */
			var order;
			if (!orderValueIdentifier) {
				// use the first one if no orderValueIdentifier provided
				order = resolveOrder(fhirBundleResources);
			} else {
				var orders = _.where(fhirBundleResources, { resourceType: "DiagnosticOrder" });
				var rawOrder = _.find(orders, function(o) {
					return o.identifier[0].value === orderValueIdentifier;
				});
				order = resolveFromOrder(rawOrder, fhirBundleResources);
			}

			var reports = _.where(fhirBundleResources, { resourceType: "DiagnosticReport"});
			var orderId = "DiagnosticOrder/" + order.id;

			/* Report */
			var rawReport = _.find(reports, function(r) {
				var request = r.requestDetail || r.request;
				return request[0].reference === orderId;
			});
			var report = cloneDeep(rawReport);
			report.subject = _.findWhere(fhirBundleResources, { resourceType: "Patient", id: getReferencedId(report.subject.reference)});
			report.performer = _.findWhere(fhirBundleResources, { resourceType: "Organization", id: getReferencedId(report.performer.reference)});
			report.requestDetail = _.map(report.requestDetail || report.request, function(request) {
				return resolveOrder(fhirBundleResources, getReferencedId(request.reference));
			});
			report.result = _.map(report.result, function(observation) {
				var realObs = _.findWhere(fhirBundleResources, {resourceType: "Observation", id: getReferencedId(observation.reference)});
				resolveRelatedObservations(realObs, fhirBundleResources);
				return realObs;
			});

			return {
				diagnosticOrder: order,
				diagnosticReport: report,
				observations: report.result
			};
		}
	};
};
